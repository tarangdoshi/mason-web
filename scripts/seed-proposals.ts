import { createClient } from "@sanity/client";
import { PROPOSAL_COMPONENTS } from "../lib/proposals/components";
import { componentSeeds, seedProblems, templateSeed } from "../content/proposals/seed";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../sanity/env";

/* Seeds the Proposal Builder documents as Sanity DRAFTS for founder review in Studio.
   Dry run by default; `--apply` writes. Existing photos and icons are never touched:
   component drafts are created if missing and only text fields are set. */

const apply = process.argv.includes("--apply");
const problems = seedProblems(componentSeeds, templateSeed);
if (problems.length) {
  console.error(`Refusing to seed: ${problems.length} problem(s).\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

const componentDocs = PROPOSAL_COMPONENTS.map((component) => ({
  _id: `drafts.componentLibrary-${component.key}`,
  _type: "componentLibrary",
  key: component.key,
  name: component.name,
  ...componentSeeds[component.key]
}));
const templateDoc = { _id: `drafts.proposalTemplate-${templateSeed.version}`, _type: "proposalTemplate", ...templateSeed,
  paymentTerms: templateSeed.paymentTerms,
  whatHappensNext: templateSeed.whatHappensNext.map((item, index) => ({ _key: `step-${index + 1}`, _type: "proposalStep", ...item })) };

if (!apply) {
  console.log(`Dry run. Would write ${componentDocs.length} component drafts and ${templateDoc._id}. Re-run with --apply.`);
  process.exit(0);
}

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token || !sanityProjectId) {
  console.error("SANITY_API_WRITE_TOKEN and NEXT_PUBLIC_SANITY_PROJECT_ID are required with --apply.");
  process.exit(1);
}
const client = createClient({ projectId: sanityProjectId, dataset: sanityDataset, apiVersion: sanityApiVersion, token, useCdn: false });
const tx = client.transaction();
for (const { _id, _type, key, name, ...text } of componentDocs) {
  tx.createIfNotExists({ _id, _type, key, name });
  tx.patch(_id, (patch) => patch.set({ key, name, ...text }));
}
tx.createIfNotExists({ _id: templateDoc._id, _type: templateDoc._type, version: templateDoc.version });
const { _id: templateId, _type: _ignored, ...templateFields } = templateDoc;
void _ignored;
tx.patch(templateId, (patch) => patch.set(templateFields));
await tx.commit();
console.log(`Wrote ${componentDocs.length} component drafts and ${templateId}. Review and publish them in Studio.`);
