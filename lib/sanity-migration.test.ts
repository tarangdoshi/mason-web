import test from "node:test";
import assert from "node:assert/strict";
import {
  APPROVED_FEATURES,
  PACKAGE_IDS,
  TESTIMONIAL_IDS,
  buildMigrationPlan,
  buildMigrationPlanForScope,
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
  assert.deepEqual(parseMigrationArgs([]), { apply: false, dryRun: true, backupDir: undefined, scope: "all" });
  assert.throws(() => parseMigrationArgs(["--execute"]), /removed/);
  assert.throws(() => assertApplyBackupDir(undefined), /without --backup-dir/);
  assert.equal(parseMigrationArgs(["--apply", "--backup-dir", "/tmp/mason-backup"]).apply, true);
  assert.equal(parseMigrationArgs(["--scope", "homepage"]).dryRun, true);
});

test("homepage scope is independently selectable and does not require package features", () => {
  const source = snapshot();
  const plan = buildMigrationPlanForScope({ homepage: source.homepage, packages: [], testimonials: [], features: [] }, "homepage");
  assert.ok(plan.operations.length > 0);
  assert.ok(plan.operations.every((operation) => operation.documentId === "homepage"));
  assert.deepEqual(plan.resolvedFeatureIds, []);
  assert.deepEqual(
    plan.operations.filter((operation) => operation.path.startsWith("hero.")).map((operation) => operation.path),
    ["hero.eyebrow", "hero.heading", "hero.subcopy", "hero.primaryCta", "hero.secondaryCta", "hero.supportPoints"],
  );
  assert.equal(parseMigrationArgs(["--scope", "homepage"]).scope, "homepage");
  assert.equal(parseMigrationArgs(["--scope=homepage"]).scope, "homepage");
});

test("package scope retains the fail-closed feature reference check", () => {
  const broken = snapshot();
  broken.packages[1] = { ...broken.packages[1], includedFeatures: broken.packages[1].includedFeatures.slice(0, 11) };
  assert.throws(
    () => buildMigrationPlanForScope({ homepage: undefined, packages: broken.packages, testimonials: [], features: broken.features }, "packages"),
    /same feature documents|exactly the approved/,
  );
});

test("homepage process and FAQ copy keep the request-first launch flow", () => {
  const source = snapshot();
  const plan = buildMigrationPlanForScope({ homepage: source.homepage, packages: [], testimonials: [], features: [] }, "homepage");
  const process = plan.operations.find((operation) => operation.path === "processSection.steps");
  const faq = plan.operations.find((operation) => operation.path === "faqSection.items");
  assert.ok(process);
  assert.ok(faq);

  const steps = process.proposedValue as Array<Record<string, unknown>>;
  assert.deepEqual(steps.map((step) => step.title), ["Request your visit", "Mason follow-up", "Inspection", "Technician visit", "Installation", "Success handover"]);
  assert.equal(steps[2].description, "We schedule a virtual or physical bathroom inspection depending on location and logistics.");
  assert.equal(steps[4].badge, "INCLUDED");
  assert.doesNotMatch(JSON.stringify(steps), /online|payment link|ADD_ON/i);

  const faqItems = faq.proposedValue as Array<Record<string, unknown>>;
  const booking = faqItems.find((item) => item.question === "How does booking work?");
  const payment = faqItems.find((item) => item.question === "How can I pay?");
  const cancellation = faqItems.find((item) => item.question === "Can I cancel after booking?");
  assert.equal(booking?.answer, "Leave your details and a Mason advisor will call to arrange the visit.");
  assert.equal(payment?.answer, "Our team will confirm the package and payment details with you after your visit request.");
  assert.equal(cancellation?.answer, "Yes. Full refund any time before installation.");
});

test("array helper reports deliberate replacement and keeps matching custom fields", () => {
  const operation = createArrayReplacementOperation("homepage", { _id: "homepage", _type: "homepage", section: [{ _key: "one", custom: "retain" }] }, "section", [{ _key: "one", value: "new" }], "approved set");
  assert.equal(operation.kind, "array-replacement");
  assert.equal((operation.proposedValue as Array<Record<string, unknown>>)[0].custom, "retain");
  assert.equal(operation.reason, "approved set");
});


test("homepage alt correction preserves image configuration and removes obsolete launch phrases", () => {
  const source = snapshot();
  const visual = { _type: "image", alt: "Family discussing a home safety visit and booking online", asset: { _ref: "image-existing" }, crop: { top: 0.1 }, objectPosition: "52% 44%", custom: "keep" };
  const document = { ...source.homepage, processSection: { steps: [{ _key: "process-step-1", visual }] } };
  const plan = buildMigrationPlanForScope({ ...source, homepage: document }, "homepage");
  const steps = plan.operations.find((operation) => operation.path === "processSection.steps")?.proposedValue as Array<Record<string, unknown>>;
  assert.deepEqual(steps[0].visual, { ...visual, alt: "Family discussing a home safety visit at a table" });
  assert.doesNotMatch(JSON.stringify(plan.operations.map((operation) => operation.proposedValue)), /free visit|online payment|pay securely|booking online|proceed to payment|ADD_ON|Book Package/i);
});
