import { createClient } from "@sanity/client";
import { PROPOSAL_COMPONENTS } from "../lib/proposals/components";
import { cmoPendingComponents, componentSeeds, seedProblems, templateSeed, type TemplateSeed } from "../content/proposals/seed";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../sanity/env";

/* Seeds the Proposal Builder documents as Sanity DRAFTS (`drafts.*` IDs) for founder/CMO review.
   Nothing is ever published by this script. Dry run by default (reads only);
   `--apply` writes. With a Sanity token the dry run reports, per document, "exists, skip" or "would create draft".
   A document that already exists (published or draft) is skipped entirely, so
   re-running never shadows published photos or resets edits. */

const apply = process.argv.includes("--apply");

type Doc = { _id: string; _type: string; [field: string]: unknown };
const keyed = <T extends object>(items: T[], type: string, prefix: string) =>
  items.map((item, index) => ({ _key: `${prefix}-${index + 1}`, _type: type, ...item }));

export function plannedDocuments(template: TemplateSeed = templateSeed): Doc[] {
  const components: Doc[] = PROPOSAL_COMPONENTS.map((component) => ({
    _id: `drafts.componentLibrary-${component.key}`,
    _type: "componentLibrary",
    key: component.key,
    name: component.name,
    ...componentSeeds[component.key]
  }));
  const proposalTemplate: Doc = {
    _id: `drafts.proposalTemplate-${template.version}`,
    _type: "proposalTemplate",
    ...template,
    optionsPage: { ...template.optionsPage, reassurances: keyed(template.optionsPage.reassurances, "reassurance", "reassurance") },
    essentialPage: { ...template.essentialPage, included: keyed(template.essentialPage.included, "includedItem", "included") },
    whatHappensNext: keyed(template.whatHappensNext, "proposalStep", "step")
  };
  return [...components, proposalTemplate];
}

async function main() {
  const problems = seedProblems(componentSeeds, templateSeed);
  if (problems.length) {
    console.error(`Refusing to seed: ${problems.length} problem(s).\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  const docs = plannedDocuments();
  const pending = cmoPendingComponents(componentSeeds);
  const baseId = (id: string) => id.replace(/^drafts\./, "");
  // A dry run only reads, so any token that can see drafts will do; --apply needs the write token.
  const token = apply ? process.env.SANITY_API_WRITE_TOKEN : process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
  const canQuery = Boolean(token && sanityProjectId);
  if (apply && !canQuery) {
    console.error("SANITY_API_WRITE_TOKEN and NEXT_PUBLIC_SANITY_PROJECT_ID are required with --apply.");
    process.exit(1);
  }
  let existing: Set<string> | null = null;
  if (canQuery) {
    // "raw" so the existence check sees drafts as well as published documents.
    const client = createClient({ projectId: sanityProjectId, dataset: sanityDataset, apiVersion: sanityApiVersion, token, useCdn: false, perspective: "raw" });
    const found = await client.fetch<string[]>("*[_id in $ids]._id", { ids: docs.flatMap((doc) => [baseId(doc._id), `drafts.${baseId(doc._id)}`]) });
    existing = new Set(found.map(baseId));
    if (apply) return write(client, docs, existing);
  }

  if (process.argv.includes("--json")) console.log(JSON.stringify(docs, null, 2));
  console.log(`Dry run (dataset "${sanityDataset}"). Nothing is written or published.`);
  for (const doc of docs) {
    const state = existing === null ? "not checked (no Sanity token)" : existing.has(baseId(doc._id)) ? "exists, skip" : "would create draft";
    console.log(`  ${doc._id}: ${state}`);
  }
  if (existing !== null) console.log(`Summary: ${docs.filter((doc) => existing!.has(baseId(doc._id))).length} exist (skip), ${docs.filter((doc) => !existing!.has(baseId(doc._id))).length} would be created.`);
  console.log(`Benefit lines awaiting the CMO (${pending.length}): ${pending.join(", ")}`);
  console.log("Re-run with --apply to write missing drafts; add --json to print the planned documents.");
}

async function write(client: ReturnType<typeof createClient>, docs: Doc[], existing: Set<string>) {
  const baseId = (id: string) => id.replace(/^drafts\./, "");
  const toWrite = docs.filter((doc) => !existing.has(baseId(doc._id)));
  if (toWrite.length === 0) {
    console.log("Nothing to seed: every proposal document already exists. Edit them in Studio.");
    return;
  }
  const tx = client.transaction();
  for (const doc of toWrite) tx.createIfNotExists(doc);
  await tx.commit();
  console.log(`Created ${toWrite.length} DRAFT document(s) in dataset "${sanityDataset}"; skipped ${docs.length - toWrite.length} existing:`);
  for (const doc of toWrite) console.log(`  ${doc._id}`);
  console.log("Nothing was published. Review and publish in Studio once the CMO has written the remaining benefit lines.");
}

if (process.argv[1]?.endsWith("seed-proposals.ts")) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
