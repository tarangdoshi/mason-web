import { createClient } from "@sanity/client";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN are required");

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

const tx = client.transaction();
tx.createIfNotExists({ _id: featureId("anti-slip-mat-post-shower"), _type: "packageFeature", key: "anti-slip-mat-post-shower", label: "Anti-slip mat", publicLabel: "Post-shower anti-slip mat", publicDescription: "Added grip where feet leave the shower.", quantity: 1, sortOrder: 6 });
for (const [key, label, description, quantity] of features) {
  tx.patch(featureId(key), (patch) => patch.set({ publicLabel: label, publicDescription: description, quantity }));
}
tx.patch("package-package-standard", (patch) => patch.set({ referencePrice: "₹35,000", currentPrice: "₹30,000", priceLabel: "₹30,000", includedFeatures: refs, availableAddOns: [] }));
tx.patch("package-package-advanced", (patch) => patch.set({ referencePrice: "₹44,000", currentPrice: "₹37,000", priceLabel: "₹37,000", followUpLabel: "1-Year Safety Check-Up Included", includedFeatures: refs, availableAddOns: [] }));
await tx.commit();
console.log(`Migrated additive package presentation fields and ${features.length} public feature definitions in ${projectId}/${dataset}. Existing legacy fields/documents were retained.`);
