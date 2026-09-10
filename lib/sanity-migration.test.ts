import test from "node:test";
import assert from "node:assert/strict";
import {
  APPROVED_FEATURES,
  PACKAGE_IDS,
  TESTIMONIAL_IDS,
  buildMigrationPlan,
} from "../scripts/migrate-prerna-content";
import {
  assertApplyBackupDir,
  createArrayReplacementOperation,
  parseMigrationArgs,
} from "./sanity-migration";

function homepage() {
  return {
    _id: "homepage",
    _type: "homepage",
    hero: { supportPoints: ["old"], customVisual: { keep: true } },
    transformationGallerySection: {},
    whatWeDoSection: {},
    evidenceSection: { cards: [{ _key: "ev-card-serious-injury", legacyField: "keep" }] },
    packagesSection: {},
    whySection: { items: [] },
    processSection: { steps: [] },
    testimonialsSection: {},
    faqSection: { items: [] },
    finalCtaSection: {},
  };
}

function snapshot() {
  const features = APPROVED_FEATURES.map(([key, label]) => ({ _id: `feature-${key}`, _type: "packageFeature", key, label }));
  const refs = features.map((feature) => ({ _key: feature.key, _type: "reference", _ref: feature._id }));
  const packages = PACKAGE_IDS.map((id, index) => ({ _id: id, _type: "package", code: index === 0 ? "package-standard" : "package-advanced", name: index === 0 ? "Standard" : "Advanced", includedFeatures: refs }));
  return {
    homepage: homepage(),
    packages,
    testimonials: TESTIMONIAL_IDS.map((id) => ({ _id: id, _type: "testimonial", city: "Delhi" })),
    features,
  };
}

test("migration uses leaf paths and preserves unknown array item fields", () => {
  const plan = buildMigrationPlan(snapshot());
  assert.ok(plan.operations.every((operation) => operation.path !== "hero" && operation.path !== "evidenceSection"));
  const evidence = plan.operations.find((operation) => operation.path === "evidenceSection.cards");
  assert.ok(evidence);
  assert.equal((evidence.proposedValue as Array<Record<string, unknown>>)[0].legacyField, "keep");
  assert.ok(plan.operations.some((operation) => operation.documentId === "package-package-standard" && operation.path === "currentPrice"));
});

test("a second plan over migrated values is idempotent at the operation level", () => {
  const first = buildMigrationPlan(snapshot());
  const migrated = snapshot();
  for (const operation of first.operations) {
    if (!operation.changed) continue;
    const document = [migrated.homepage, ...migrated.packages, ...migrated.testimonials, ...migrated.features].find((candidate) => candidate._id === operation.documentId);
    assert.ok(document);
    const segments = operation.path.split(".");
    let target: Record<string, unknown> = document;
    for (const segment of segments.slice(0, -1)) target = (target[segment] ??= {}) as Record<string, unknown>;
    target[segments.at(-1) as string] = operation.proposedValue;
  }
  const second = buildMigrationPlan(migrated);
  assert.equal(second.operations.filter((operation) => operation.changed).length, 0);
});

test("ambiguous package feature references fail closed", () => {
  const broken = snapshot();
  broken.packages[1] = { ...broken.packages[1], includedFeatures: broken.packages[1].includedFeatures.slice(0, 11) };
  assert.throws(() => buildMigrationPlan(broken), /same feature documents|exactly the approved/);
});

test("apply requires an explicit backup directory and dry-run is the default", () => {
  assert.deepEqual(parseMigrationArgs([]), { apply: false, dryRun: true, backupDir: undefined });
  assert.throws(() => parseMigrationArgs(["--execute"]), /removed/);
  assert.throws(() => assertApplyBackupDir(undefined), /without --backup-dir/);
  assert.equal(parseMigrationArgs(["--apply", "--backup-dir", "/tmp/mason-backup"]).apply, true);
});

test("array helper reports deliberate replacement and keeps matching custom fields", () => {
  const operation = createArrayReplacementOperation("homepage", { _id: "homepage", _type: "homepage", section: [{ _key: "one", custom: "retain" }] }, "section", [{ _key: "one", value: "new" }], "approved set");
  assert.equal(operation.kind, "array-replacement");
  assert.equal((operation.proposedValue as Array<Record<string, unknown>>)[0].custom, "retain");
  assert.equal(operation.reason, "approved set");
});
