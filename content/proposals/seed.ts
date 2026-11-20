import { PROPOSAL_COMPONENTS, type ProposalComponentKey } from "../../lib/proposals/components";

/* Seed copy for the Proposal Builder Sanity documents.
   Source: the founder-approved proposal design of 20 Nov 2026, with the customer's name removed.
   Until that HTML is supplied, every value below is a PENDING marker and the seed script refuses to run.
   Never put a real customer's name, phone, email or address in this file. */

export const PENDING = "PENDING_FOUNDER_COPY";

export type ComponentSeed = { benefitLine: string; description?: string; complimentary: boolean };

export type TemplateSeed = {
  version: string;
  pageCopy: {
    eyebrow?: string;
    headline: string;
    intro: string;
    assessmentSummaryHeading?: string;
    recommendedLabel: string;
    presentLabel: string;
    declinedLabel: string;
    complimentaryLabel: string;
    essentialTitle: string;
    essentialSummary?: string;
    addonTitle: string;
    addonSummary?: string;
    otherRoomsLine: string;
    closing?: string;
  };
  paymentTerms: string[];
  whatHappensNext: { title: string; body?: string }[];
  disclaimer: string;
};

export const componentSeeds: Record<ProposalComponentKey, ComponentSeed> = Object.fromEntries(
  PROPOSAL_COMPONENTS.map((component) => [component.key, { benefitLine: PENDING, complimentary: false }])
) as Record<ProposalComponentKey, ComponentSeed>;

export const templateSeed: TemplateSeed = {
  version: "v1",
  pageCopy: {
    headline: PENDING,
    intro: PENDING,
    recommendedLabel: "Recommended",
    presentLabel: "Already present",
    declinedLabel: "Not needed",
    complimentaryLabel: "Complimentary",
    essentialTitle: "Essential",
    addonTitle: "Essential + Add-on",
    otherRoomsLine: "Other rooms: quoted after inspection."
  },
  paymentTerms: [PENDING],
  whatHappensNext: [{ title: PENDING }],
  disclaimer: PENDING
};

/** Every problem that stops the seed being written. Empty means it is safe to seed. */
export function seedProblems(components: Record<string, ComponentSeed>, template: TemplateSeed): string[] {
  const problems: string[] = [];
  const pending = (path: string, value: unknown) => {
    if (typeof value === "string" && value.includes(PENDING)) problems.push(`${path} still holds placeholder copy`);
  };
  for (const { key } of PROPOSAL_COMPONENTS) {
    const seed = components[key];
    if (!seed) { problems.push(`component ${key} is missing`); continue; }
    if (!seed.benefitLine?.trim()) problems.push(`component ${key} benefit line is empty`);
    pending(`component ${key} benefit line`, seed.benefitLine);
    pending(`component ${key} description`, seed.description);
  }
  for (const extra of Object.keys(components)) {
    if (!PROPOSAL_COMPONENTS.some((component) => component.key === extra)) problems.push(`unknown component ${extra}`);
  }
  if (!/^v\d+$/.test(template.version)) problems.push("template version must look like v1");
  for (const [field, value] of Object.entries(template.pageCopy)) pending(`pageCopy.${field}`, value);
  for (const field of ["headline", "intro", "essentialTitle", "addonTitle", "otherRoomsLine"] as const) {
    if (!template.pageCopy[field]?.trim()) problems.push(`pageCopy.${field} is empty`);
  }
  if (template.paymentTerms.length === 0 || template.paymentTerms.some((term) => !term.trim())) problems.push("payment terms are empty");
  template.paymentTerms.forEach((term, index) => pending(`paymentTerms[${index}]`, term));
  if (template.whatHappensNext.length === 0 || template.whatHappensNext.some((item) => !item.title.trim())) problems.push("what-happens-next steps are empty");
  template.whatHappensNext.forEach((item, index) => { pending(`whatHappensNext[${index}].title`, item.title); pending(`whatHappensNext[${index}].body`, item.body); });
  if (!template.disclaimer.trim()) problems.push("disclaimer is empty");
  pending("disclaimer", template.disclaimer);
  return problems;
}
