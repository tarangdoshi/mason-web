import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN are required");
const dryRun = process.argv.includes("--dry-run");

const client = createClient({ projectId, dataset, token, apiVersion: "2026-06-16", useCdn: false });
const featureId = (key: string) => `packageFeature-${key}`;

const features = [
  ["vertical-grab-bars", "Vertical grab bars", "Support placed at key standing and movement points.", 3],
  ["angled-grab-bar", "L / angled grab bar", "Angled support for reaching and turning.", 1],
  ["folding-bar", "Flip-up / folding support bar", "Foldable support where access and clearance matter.", 1],
  ["anti-slip-coating", "Anti-slip surface treatment", "Treatment for improved traction on existing surfaces.", 1],
  ["anti-slip-mat-shower", "Shower anti-slip mat", "Added grip in the shower zone.", 1],
  ["anti-slip-mat-post-shower", "Post-shower anti-slip mat", "Added grip where feet leave the shower.", 1],
  ["shower-stool", "Shower seating stool", "Seated support for showering.", 1],
  ["two-way-lock", "Two-way lock", "A lock designed for safer access and family response.", 1],
  ["corner-safety", "Edge & corner protection", "Protective cushioning for sharp edges and corners that could cause injury.", 1],
  ["drainage-solution", "Drainage support", "Drainage improvements without redesigning the bathroom.", 4],
  ["slippers-one", "Bathroom slippers", "Bathroom-use slippers for steadier footing.", 1],
  ["total-support-solution", "Reinforced fixture support", "Upgraded high-strength fixings for toilets and washbasins to improve stability and long-term support.", 1]
] as const;

const commonKeys = features.map(([key]) => key);
const refs = commonKeys.map((key) => ({ _key: key, _type: "reference", _ref: featureId(key) }));

const targetIds = [
  "package-package-standard",
  "package-package-advanced",
  ...commonKeys.filter((key) => key !== "anti-slip-mat-post-shower").map(featureId)
];
const existing = await client.fetch<Array<{ _id: string; _type: string; key?: string; code?: string; name?: string }>>(
  `*[_id in $targetIds]{_id, _type, key, code, name}`,
  { targetIds }
);
const byId = new Map(existing.map((doc) => [doc._id, doc]));
for (const id of targetIds) {
  if (!byId.has(id)) throw new Error(`Preflight failed: expected existing Sanity document ${id} was not found.`);
}
for (const [id, expectedCode, expectedName] of [
  ["package-package-standard", "package-standard", "Standard"],
  ["package-package-advanced", "package-advanced", "Advanced"]
] as const) {
  const doc = byId.get(id);
  if (doc?._type !== "package" || doc.code !== expectedCode || doc.name !== expectedName) {
    throw new Error(`Preflight failed: ${id} is not the expected ${expectedName} package document.`);
  }
}

console.log(`Sanity package migration target: ${projectId}/${dataset}`);
console.log(`Preflight: ${existing.length} existing target documents verified; one feature may be created if absent.`);
if (dryRun) {
  console.log(`Dry run: would set ${features.length} public feature definitions and update both locked package documents. No writes made.`);
  process.exit(0);
}

const tx = client.transaction();
tx.createIfNotExists({ _id: featureId("anti-slip-mat-post-shower"), _type: "packageFeature", key: "anti-slip-mat-post-shower", label: "Anti-slip mat", publicLabel: "Post-shower anti-slip mat", publicDescription: "Added grip where feet leave the shower.", quantity: 1, sortOrder: 6 });
for (const [key, label, description, quantity] of features) {
  if (key === "anti-slip-mat-post-shower") continue;
  tx.patch(featureId(key), (patch) => patch.set({ publicLabel: label, publicDescription: description, quantity }));
}
tx.patch("package-package-standard", (patch) => patch.set({ referencePrice: "₹35,000", currentPrice: "₹30,000", priceLabel: "₹30,000", includedFeatures: refs, availableAddOns: [] }));
tx.patch("package-package-advanced", (patch) => patch.set({ referencePrice: "₹44,000", currentPrice: "₹37,000", priceLabel: "₹37,000", followUpLabel: "1-Year Safety Check-Up Included", includedFeatures: refs, availableAddOns: [] }));
await tx.commit();
console.log(`Migrated additive package presentation fields and ${features.length} public feature definitions in ${projectId}/${dataset}. Existing legacy fields/documents were retained.`);
