import { createClient, type SanityClient } from "@sanity/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertApplyBackupDir,
  createArrayReplacementOperation,
  createLeafOperation,
  parseMigrationArgs,
  sameStringSet,
  type MigrationScope,
  type MigrationOperation,
  type SanityDocument,
} from "../lib/sanity-migration";

export const HOMEPAGE_ID = "homepage";
export const PACKAGE_IDS = ["package-package-standard", "package-package-advanced"] as const;
export const TESTIMONIAL_IDS = ["testimonial-ts-1", "testimonial-ts-2", "testimonial-ts-3"] as const;
const EXPECTED_PACKAGES = [
  { code: "package-standard", name: "Standard" },
  { code: "package-advanced", name: "Advanced" },
] as const;

export const APPROVED_FEATURES = [
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
  ["total-support-solution", "Reinforced fixture support", "Upgraded high-strength fixings for toilets and washbasins to improve stability and long-term support.", 1],
] as const;

const faqItems = [
  ["faq-1", "What does Mason Company do?", "Mason Company upgrades existing bathrooms with grab support, anti-slip treatments and mats, shower seating, safer locks, edge and corner protection, drainage support, slippers, and reinforced fixture support."],
  ["faq-2", "Who is Mason Company for?", "Mason is designed for families with ageing parents, seniors living independently, people with balance concerns, and households that want to reduce bathroom risk before an incident happens."],
  ["faq-3", "Do you renovate the entire bathroom?", "No. Mason focuses on safety upgrades to the existing bathroom. Most installations do not require a major renovation."],
  ["faq-4", "Will the bathroom look clinical?", "No. Mason's solution is designed to feel premium and home-first. The goal is to improve safety while preserving the comfort and dignity of the space."],
  ["faq-5", "What packages do you offer?", "Mason currently offers two packages: Standard at ₹30,000 and Advanced at ₹37,000. Both install exactly the same complete kit. Advanced adds one technician safety check-up visit during the first year."],
  ["faq-6", "What is included in Standard?", "The complete 12-item kit includes three vertical grab bars, one L / angled bar, one folding support bar, one anti-slip treatment, one shower mat, one post-shower mat, one shower stool, one two-way lock, one edge and corner protection treatment, four drainage supports, one pair of bathroom slippers, and one reinforced fixture support. Toilet-seat support, sensor lighting, and SOS hardware are not included."],
  ["faq-7", "What is included in Advanced?", "Exactly the same 12-item installation kit as Standard. Advanced adds one technician follow-up visit within the first year: we inspect the completed work, check for flaws or additional support needs, and cover necessary corrective work or additional support identified during that included visit."],
  ["faq-8", "Can I buy only one product, like a grab bar?", "Mason is designed as a package-first service. We focus on complete bathroom safety coverage rather than isolated product installation."],
  ["faq-9", "How does booking work?", "Leave your details and a Mason advisor will call to arrange the visit."],
  ["faq-10", "How can I pay?", "Our team will confirm the package and payment details with you after your visit request."],
  ["faq-11", "Can I cancel after booking?", "Yes. Full refund any time before installation."],
  ["faq-12", "Do you inspect the bathroom before installation?", "Yes. Depending on location and logistics, Mason may complete a virtual or physical inspection before installation."],
  ["faq-13", "Who installs the package?", "Mason-trained technicians handle the installation, site verification, fitting, and final handover."],
].map(([key, question, answer]) => ({ _key: key, question, answer }));

const evidenceCards = [
  { _key: "ev-card-serious-injury", id: "ev-card-serious-injury", kicker: "Reported injury and/or fall", value: "25%", label: "Among Indians aged 60+, 1 in 4 reported an injury and/or fall in the previous two years.", context: "Fall risk is already present in many ageing households.", sourceLabel: "LASI India Executive Summary", sourceId: "lasi-exec-2019", ctaLabel: "View Evidence", ctaHref: "/evidence" },
  { _key: "ev-card-independence-loss", id: "ev-card-independence-loss", kicker: "Bathroom injuries from falls", value: "81%", label: "Falls are the dominant risk around wet zones, toilets, and transfers.", context: "The bathroom concentrates several high-risk movements in one room.", sourceLabel: "CDC Bathroom Injuries Report", sourceId: "cdc-bathroom-injuries", ctaLabel: "View Evidence", ctaHref: "/evidence" },
  { _key: "ev-card-falls-injury-rate", id: "ev-card-falls-injury-rate", kicker: "Falls that led to injury", value: "66%", label: "A review of older adults in India put the pooled injury rate at 65.6% among those who fell.", context: "A fall often carries an injury burden beyond the immediate incident.", sourceLabel: "India falls-injury systematic review", sourceId: "india-falls-injury-review", ctaLabel: "View Evidence", ctaHref: "/evidence" },
  { _key: "ev-card-prevention-effect", id: "ev-card-prevention-effect", kicker: "Fewer falls after home changes", prefix: "Up to", value: "38%", label: "Home hazard interventions cut fall rates by 26–38%, with the largest effect for higher-risk adults.", context: "Targeted changes at home can make a measurable difference.", sourceLabel: "Cochrane home-hazard reduction review", sourceId: "cochrane-home-hazards-2021", ctaLabel: "View Evidence", ctaHref: "/evidence" },
];

const processSteps = [
  { _key: "process-step-1", id: "process-step-1", title: "Request your visit", description: "Leave your details and a Mason advisor will call to arrange the visit." },
  { _key: "process-step-2", id: "process-step-2", title: "Mason follow-up", description: "Our team reviews your request and contacts you to confirm the visit, package details, and next steps." },
  { _key: "process-step-3", id: "process-step-3", title: "Inspection", description: "We schedule a virtual or physical bathroom inspection depending on location and logistics." },
  { _key: "process-step-4", id: "process-step-4", title: "Technician visit", description: "Our trained technicians verify the site and finalise support placement." },
  { _key: "process-step-5", id: "process-step-5", title: "Installation", description: "The selected package is installed with careful fitting, clean execution, and minimal disruption.", badge: "INCLUDED" },
  { _key: "process-step-6", id: "process-step-6", title: "Success handover", description: "We complete a walkthrough and document the upgrade with before-and-after pictures." },
];

const whyItems = [
  ["why-1", "Comprehensive by design", "We look at the full bathroom routine: entry, turning, sitting, standing, showering, and night-time use."],
  ["why-2", "Doctor-informed planning", "Our approach is shaped with doctor inputs, preventive mobility guidance, and senior-care context."],
  ["why-3", "Trained Mason experts", "Every visit is handled by trained technicians who understand support placement and secure fitting."],
  ["why-4", "One accountable team", "From selection to inspection, installation, and follow-up, Mason stays responsible for the outcome."],
  ["why-5", "Premium, home-first finish", "Built to feel calm and considered - not hospital-like or temporary."],
  ["why-6", "Evidence-led prevention", "We study fall-risk patterns and assisted-care environments to design practical home upgrades."],
].map(([key, title, description]) => ({ _key: key, title, description }));

const homepageScalarValues: Array<[string, unknown]> = [
  ["hero.eyebrow", "Bathroom Safety for Ageing Parents"],
  ["hero.heading", "Most falls happen here. We make sure yours don't."],
  ["hero.subcopy", "You can't always be there - safety can be. Premium, doctor-informed, expertly-installed bathroom safety."],
  ["hero.primaryCta", "Book a Safety Visit"],
  ["hero.secondaryCta", "See Transformations"],
  ["transformationGallerySection.title", "A reassurance. Not a renovation."],
  ["transformationGallerySection.subtitle", "We make bathrooms safer through thoughtful additions - grip, balance, comfort, ease. Drag to see the difference."],
  ["whatWeDoSection.description", "Leave your details and a Mason advisor will call to arrange the visit. Full refund any time before installation."],
  ["evidenceSection.title", "The response should be thoughtful."],
  ["evidenceSection.subtitle", "Numbers that make the decision visible."],
  ["packagesSection.title", "The same complete kit. You choose the cover."],
  ["packagesSection.subtitle", "Both packages install everything, fitted by Mason-trained experts. Advanced includes one safety check-up visit during the first year."],
  ["whySection.title", "Why Mason Company"],
  ["whySection.subtitle", "A complete bathroom safety solution, shaped by medical expertise, expert installation, and the design standards families expect at home."],
  ["processSection.title", "From booking to a safer bathroom."],
  ["processSection.subtitle", "Six clear steps, handled by one accountable Mason team - from your visit request all the way to final handover."],
  ["processSection.addOnDisclosure", "Clear steps. Assisted support. One accountable Mason team from booking to handover."],
  ["processSection.primaryCta", "Book a Safety Visit"],
  ["processSection.secondaryCta", "Talk to a Mason Company specialist"],
  ["testimonialsSection.title", "What Families Say After Installation"],
  ["testimonialsSection.subtitle", "Families choose Mason Company because the upgrade feels thoughtful, premium, and reassuring, not like a temporary hospital setup."],
  ["faqSection.title", "Questions, answered"],
  ["faqSection.subtitle", "Everything about packages, booking, and installation. Still unsure? Request a visit and we'll talk it through."],
  ["finalCtaSection.title", "Book the visit. We'll handle the rest."],
  ["finalCtaSection.subtitle", "Act before a fall changes everything. Leave your number and one accountable Mason team handles the rest."],
  ["finalCtaSection.primaryCta", "Request a Callback"],
];

const packageValues = [
  { id: PACKAGE_IDS[0], fields: { badge: "The complete kit", bestFor: "The full safety upgrade, installed, inspected and handed over in one go.", outcome: "A complete everyday safety upgrade for steadier movement, better grip, and more confidence at home.", referencePrice: "₹35,000", currentPrice: "₹30,000", ctaLabel: "Book Standard", isFeatured: true } },
  { id: PACKAGE_IDS[1], fields: { badge: "The complete kit + 1-Year Safety Check-Up Included", bestFor: "The same installation, with one included safety check-up during the first year.", outcome: "One technician visit within the first year to inspect the work, identify issues or additional support needs, and complete necessary corrective work covered by the package.", referencePrice: "₹44,000", currentPrice: "₹37,000", followUpLabel: "1-Year Safety Check-Up Included", ctaLabel: "Book Advanced", isFeatured: false } },
];

const testimonialCities = ["Bengaluru", "Goa", "Bengaluru"];

type Snapshot = { homepage?: SanityDocument; packages: SanityDocument[]; testimonials: SanityDocument[]; features: SanityDocument[] };

function requirePublished(document: SanityDocument, expectedType: string): void {
  if (document._id.startsWith("drafts.")) throw new Error(`Safety check failed: draft ${document._id} is not an allowed migration target.`);
  if (document._type !== expectedType) throw new Error(`Safety check failed: ${document._id} is ${document._type}; expected ${expectedType}.`);
}

function resolveFeatureRefs(packages: SanityDocument[]): string[] {
  const refSets = packages.map((doc) => {
    const refs = doc.includedFeatures;
    if (!Array.isArray(refs) || refs.length === 0) throw new Error(`Safety check failed: ${doc._id}.includedFeatures is missing or empty.`);
    const ids = refs.map((ref) => {
      if (!ref || typeof ref !== "object" || typeof (ref as Record<string, unknown>)._ref !== "string") throw new Error(`Safety check failed: ${doc._id}.includedFeatures has an unresolved reference.`);
      return (ref as Record<string, unknown>)._ref as string;
    });
    if (new Set(ids).size !== ids.length) throw new Error(`Safety check failed: ${doc._id}.includedFeatures contains duplicate references.`);
    return ids;
  });
  if (!sameStringSet(refSets[0], refSets[1])) throw new Error("Safety check failed: Standard and Advanced do not reference the same feature documents.");
  return refSets[0];
}

function buildHomepageOperations(homepage: SanityDocument): MigrationOperation[] {
  requirePublished(homepage, "homepage");
  const operations: MigrationOperation[] = [];
  for (const [fieldPath, value] of homepageScalarValues) operations.push(createLeafOperation(homepage._id, homepage, fieldPath, value));
  operations.push(createArrayReplacementOperation(homepage._id, homepage, "hero.supportPoints", ["Premium home-first finish", "Trained Mason experts", "Doctor-reviewed planning"], "Approved hero support points are a controlled scalar list."));
  operations.push(createArrayReplacementOperation(homepage._id, homepage, "evidenceSection.cards", evidenceCards, "Approved evidence card set changes item content and is replaced deliberately; matching _key fields retain unknown custom fields."));
  operations.push(createArrayReplacementOperation(homepage._id, homepage, "whySection.items", whyItems, "Approved Why Mason item set is replaced deliberately; matching _key fields retain unknown custom fields."));
  const currentProcess = homepage.processSection as { steps?: Array<Record<string, unknown>> } | undefined;
  const firstStep = currentProcess?.steps?.find((step) => step._key === "process-step-1");
  const correctedProcessSteps = processSteps.map((step) => {
    if (step._key !== "process-step-1" || !firstStep?.visual || typeof firstStep.visual !== "object") return step;
    return { ...step, visual: { ...firstStep.visual, alt: "Family discussing a home safety visit at a table" } };
  });
  operations.push(createArrayReplacementOperation(homepage._id, homepage, "processSection.steps", correctedProcessSteps, "Approved process item set is replaced deliberately; matching _key fields retain unknown custom fields."));
  operations.push(createArrayReplacementOperation(homepage._id, homepage, "faqSection.items", faqItems, "Approved FAQ item set is replaced deliberately; matching _key fields retain unknown custom fields."));
  return operations;
}

function buildPackageOperations(packages: SanityDocument[], features: SanityDocument[]): { operations: MigrationOperation[]; resolvedFeatureIds: string[] } {
  if (packages.length !== 2) throw new Error("Safety check failed: both package documents are required.");
  for (const [index, doc] of packages.entries()) {
    requirePublished(doc, "package");
    const expected = EXPECTED_PACKAGES[index];
    if (doc.code !== expected.code || doc.name !== expected.name) throw new Error(`Safety check failed: ${doc._id} is not the expected ${expected.name} package document.`);
  }

  const refs = resolveFeatureRefs(packages);
  const featureById = new Map(features.map((feature) => [feature._id, feature]));
  const expectedKeys = new Set<string>(APPROVED_FEATURES.map(([key]) => key));
  const resolvedFeatures = refs.map((id) => {
    const feature = featureById.get(id);
    if (!feature) throw new Error(`Safety check failed: referenced packageFeature ${id} was not returned.`);
    requirePublished(feature, "packageFeature");
    if (typeof feature.key !== "string" || !expectedKeys.has(feature.key)) throw new Error(`Safety check failed: ${id} has an unknown or ambiguous feature key.`);
    return feature;
  });
  const resolvedKeys = resolvedFeatures.map((feature) => feature.key as string);
  if (!sameStringSet(resolvedKeys, [...expectedKeys])) throw new Error("Safety check failed: package references do not resolve to exactly the approved 12-item kit.");

  const operations: MigrationOperation[] = [];

  for (const item of packageValues) {
    const document = packages.find((candidate) => candidate._id === item.id);
    if (!document) throw new Error(`Safety check failed: ${item.id} is missing from the fetched snapshot.`);
    for (const [field, value] of Object.entries(item.fields)) operations.push(createLeafOperation(item.id, document, field, value));
  }
  const featureValues = new Map<string, { publicLabel: string; publicDescription: string; quantity: number }>(APPROVED_FEATURES.map(([key, label, description, quantity]) => [key, { publicLabel: label, publicDescription: description, quantity }]));
  for (const feature of resolvedFeatures) {
    const values = featureValues.get(feature.key as string);
    if (!values) throw new Error(`Safety check failed: no approved public definition exists for ${feature._id}.`);
    for (const [field, value] of Object.entries(values)) operations.push(createLeafOperation(feature._id, feature, field, value));
  }
  return { operations, resolvedFeatureIds: resolvedFeatures.map((feature) => feature._id) };
}

function buildTestimonialsOperations(testimonials: SanityDocument[]): MigrationOperation[] {
  if (testimonials.length !== TESTIMONIAL_IDS.length) throw new Error("Safety check failed: all targeted testimonial documents are required.");
  for (const doc of testimonials) requirePublished(doc, "testimonial");
  return TESTIMONIAL_IDS.flatMap((id, index) => {
    const document = testimonials.find((candidate) => candidate._id === id);
    if (!document) throw new Error(`Safety check failed: ${id} is missing from the fetched snapshot.`);
    return [createLeafOperation(id, document, "city", testimonialCities[index])];
  });
}

export function buildHomepageMigrationPlan(homepage: SanityDocument): { operations: MigrationOperation[]; resolvedFeatureIds: string[] } {
  return { operations: buildHomepageOperations(homepage), resolvedFeatureIds: [] };
}

export function buildPackageMigrationPlan(packages: SanityDocument[], features: SanityDocument[]): { operations: MigrationOperation[]; resolvedFeatureIds: string[] } {
  return buildPackageOperations(packages, features);
}

export function buildTestimonialsMigrationPlan(testimonials: SanityDocument[]): { operations: MigrationOperation[]; resolvedFeatureIds: string[] } {
  return { operations: buildTestimonialsOperations(testimonials), resolvedFeatureIds: [] };
}

export function buildMigrationPlan(snapshot: Snapshot): { operations: MigrationOperation[]; resolvedFeatureIds: string[] } {
  if (!snapshot.homepage) throw new Error("Safety check failed: the published homepage document is required.");
  const homepage = buildHomepageMigrationPlan(snapshot.homepage);
  const packages = buildPackageMigrationPlan(snapshot.packages, snapshot.features);
  const testimonials = buildTestimonialsMigrationPlan(snapshot.testimonials);
  return { operations: [...homepage.operations, ...packages.operations, ...testimonials.operations], resolvedFeatureIds: packages.resolvedFeatureIds };
}

export function buildMigrationPlanForScope(snapshot: Snapshot, scope: MigrationScope): { operations: MigrationOperation[]; resolvedFeatureIds: string[] } {
  if (scope === "homepage") {
    if (!snapshot.homepage) throw new Error("Safety check failed: the published homepage document is required.");
    return buildHomepageMigrationPlan(snapshot.homepage);
  }
  if (scope === "packages") return buildPackageMigrationPlan(snapshot.packages, snapshot.features);
  if (scope === "testimonials") return buildTestimonialsMigrationPlan(snapshot.testimonials);
  return buildMigrationPlan(snapshot);
}

async function fetchSnapshot(client: SanityClient, scope: MigrationScope): Promise<Snapshot> {
  const rootIds = scope === "homepage" ? [HOMEPAGE_ID] : scope === "packages" ? [...PACKAGE_IDS] : scope === "testimonials" ? [...TESTIMONIAL_IDS] : [HOMEPAGE_ID, ...PACKAGE_IDS, ...TESTIMONIAL_IDS];
  const roots = await client.fetch<SanityDocument[]>(`*[_id in $ids]{..., "includedFeatureRefs": includedFeatures[]{_ref}}`, { ids: rootIds });
  const byId = new Map(roots.map((document) => [document._id, document]));
  for (const id of rootIds) if (!byId.has(id)) throw new Error(`Preflight failed: expected published Sanity document ${id} was not found.`);
  const packages = scope === "packages" || scope === "all" ? PACKAGE_IDS.map((id) => byId.get(id) as SanityDocument) : [];
  const testimonials = scope === "testimonials" || scope === "all" ? TESTIMONIAL_IDS.map((id) => byId.get(id) as SanityDocument) : [];
  const features = packages.length > 0 ? await client.fetch<SanityDocument[]>(`*[_id in $ids]{...}`, { ids: resolveFeatureRefs(packages) }) : [];
  return {
    homepage: scope === "homepage" || scope === "all" ? byId.get(HOMEPAGE_ID) as SanityDocument : undefined,
    packages,
    testimonials,
    features,
  };
}

function printPlan(snapshot: Snapshot, plan: ReturnType<typeof buildMigrationPlan>, projectId: string, dataset: string, scope: MigrationScope): void {
  console.log(`Prerna content migration target: ${projectId}/${dataset}`);
  console.log(`Migration scope: ${scope}`);
  console.log(`Resolved packageFeature references: ${plan.resolvedFeatureIds.length > 0 ? plan.resolvedFeatureIds.join(", ") : "not requested for this scope"}`);
  console.log(JSON.stringify({
    dryRun: true,
    writes: 0,
    scope,
    arraysReplacedDeliberately: plan.operations.filter((operation) => operation.kind === "array-replacement").map((operation) => ({ documentId: operation.documentId, path: operation.path, reason: operation.reason })),
    operations: plan.operations.map(({ documentId, path: fieldPath, currentValue, proposedValue, changed, kind, reason }) => ({ documentId, fieldPath, currentValue, proposedValue, changed, kind, reason })),
    snapshotDocumentIds: [
      ...(snapshot.homepage ? [snapshot.homepage._id] : []),
      ...snapshot.packages.map((doc) => doc._id),
      ...snapshot.testimonials.map((doc) => doc._id),
      ...snapshot.features.map((doc) => doc._id),
    ],
  }, null, 2));
}

async function writeBackup(snapshot: Snapshot, backupDir: string, projectId: string, dataset: string): Promise<string> {
  const resolvedDir = path.resolve(backupDir);
  await mkdir(resolvedDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[.:]/g, "-");
  const file = path.join(resolvedDir, `mason-sanity-backup-${timestamp}.json`);
  const documents = [
    ...(snapshot.homepage ? [snapshot.homepage] : []),
    ...snapshot.packages,
    ...snapshot.testimonials,
    ...snapshot.features,
  ];
  const payload = { generatedAt: new Date().toISOString(), projectId, dataset, documentIds: documents.map((document) => document._id), documents };
  await writeFile(file, JSON.stringify(payload, null, 2), "utf8");
  const verified = JSON.parse(await readFile(file, "utf8")) as typeof payload;
  if (!Array.isArray(verified.documents) || verified.documents.length !== payload.documents.length || JSON.stringify(verified.documentIds) !== JSON.stringify(payload.documentIds)) throw new Error("Backup verification failed; refusing to write Sanity.");
  return file;
}

export async function runMigration(argv = process.argv.slice(2)): Promise<void> {
  const { apply, backupDir, scope } = parseMigrationArgs(argv);
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  if (!projectId) throw new Error("NEXT_PUBLIC_SANITY_PROJECT_ID is required.");
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (apply && !token) throw new Error("SANITY_API_WRITE_TOKEN is required for --apply.");
  const client = createClient({ projectId, dataset, token, apiVersion: "2026-06-16", useCdn: false });
  const snapshot = await fetchSnapshot(client, scope);
  const plan = buildMigrationPlanForScope(snapshot, scope);
  printPlan(snapshot, plan, projectId, dataset, scope);
  if (!apply) {
    console.log("Dry run only. No writes made. Apply requires --apply --backup-dir <directory>.");
    return;
  }
  const verifiedBackupDir = assertApplyBackupDir(backupDir);
  const backupFile = await writeBackup(snapshot, verifiedBackupDir, projectId, dataset);
  const transaction = client.transaction();
  for (const operation of plan.operations.filter((candidate) => candidate.changed)) transaction.patch(operation.documentId, (patch) => patch.set({ [operation.path]: operation.proposedValue }));
  if (plan.operations.some((operation) => operation.changed)) await transaction.commit();
  console.log(`Applied ${plan.operations.filter((operation) => operation.changed).length} changed fields after verified backup ${backupFile}.`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) runMigration().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
