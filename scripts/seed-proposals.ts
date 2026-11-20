import { createClient } from "@sanity/client";
import { PROPOSAL_COMPONENTS } from "../lib/proposals/components";
import { componentSeeds, seedProblems, templateSeed } from "../content/proposals/seed";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../sanity/env";

/* Seeds the Proposal Builder documents as Sanity DRAFTS for founder review in Studio.
   Dry run by default; `--apply` writes. A document that already exists (published or draft)
   is skipped entirely, so re-running never shadows published photos or resets founder edits. */

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

// Only documents that exist in neither published nor draft form are written. Anything already there
// (photos, icons, the founder's Complimentary choice, edited copy) is left exactly as it is.
const ids = [...componentDocs.map((doc) => doc._id), templateDoc._id].map((id) => id.replace(/^drafts\./, ""));
const existing = new Set(
  (await client.fetch<string[]>("*[_id in $ids]._id", { ids: ids.flatMap((id) => [id, `drafts.${id}`]) })).map((id) => id.replace(/^drafts\./, ""))
);
const toWrite: { _id: string; _type: string; [field: string]: unknown }[] = [...componentDocs, templateDoc].filter((doc) => !existing.has(doc._id.replace(/^drafts\./, "")));
if (toWrite.length === 0) {
  console.log("Nothing to seed: every proposal document already exists. Edit them in Studio.");
  process.exit(0);
}
const tx = client.transaction();
for (const doc of toWrite) tx.createIfNotExists(doc);
await tx.commit();
console.log(`Created ${toWrite.length} draft(s); skipped ${existing.size} existing. Review and publish them in Studio.`);
