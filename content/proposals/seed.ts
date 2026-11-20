import { PROPOSAL_COMPONENTS, type ProposalComponentKey } from "../../lib/proposals/components";
import { CMO_PLACEHOLDER_PREFIX, unknownPlaceholders } from "../../sanity/schemaTypes/proposals";

/* Seed copy for the Proposal Builder Sanity documents (written as DRAFTS for founder/CMO review).
   Source: docs/proposals/approved-template-copy-2026-11-20.md in the Aegis workspace — the founder-approved
   20 Nov proposal design, with no customer data. Placeholders: {customerName}, {date}, {essentialPrice},
   {addonPrice}, {addonName}. Never put a real customer's name, phone, email or address in this file. */

/** Copy not yet supplied at all. The seed refuses to run while any remains. */
export const PENDING = "PENDING_FOUNDER_COPY";

/** A component benefit line the CMO still has to write. Allowed in a draft; Studio blocks publishing it. */
export const cmoPlaceholder = (name: string) => `${CMO_PLACEHOLDER_PREFIX} benefit line for ${name}`;

export type ComponentSeed = { benefitLine: string; description?: string; complimentary: boolean };
type Titled = { title: string; body?: string };

export type TemplateSeed = {
  version: string;
  addonName: string;
  optionsPage: {
    headerLabel: string;
    eyebrow: string;
    title: string;
    intro: string;
    reassurances: Titled[];
    sectionHeading: string;
    essentialOptionLabel: string;
    essentialTitle: string;
    whatYouGetLabel: string;
    includedLines: string[];
    complimentaryLabel: string;
    addonOptionLabel: string;
    addonTitle: string;
    addonBadge?: string;
    addonLead: string;
    addonNote?: string;
    otherRoomsLine: string;
  };
  essentialPage: { eyebrow: string; title: string; priceSuffix?: string; intro: string; includedHeading: string; included: Titled[] };
  addonPage: { eyebrow: string; title: string; intro: string; priceStripEssentialLabel: string; priceStripAddonLabel: string };
  whatHappensNext: Titled[];
  paymentHeading: string;
  paymentTerms: string[];
  closing?: string;
  signoff?: string;
  footer?: string;
  disclaimer: string;
};

/** The five benefit lines approved so far; the other nine wait for the CMO. */
const APPROVED_BENEFIT_LINES: Partial<Record<ProposalComponentKey, string>> = {
  "vertical-grab-bars": "Support at key standing and movement points.",
  "angled-grab-bar": "Angled support for reaching and turning in the shower.",
  "anti-slip-coating": "Better grip on your existing tiles, with no change to how they look.",
  "two-way-lock": "Privacy from inside, with a door family can open from outside if needed.",
  "emergency-key-box": "Lets family or helpers reach you quickly if ever needed."
};

export const componentSeeds: Record<ProposalComponentKey, ComponentSeed> = Object.fromEntries(
  PROPOSAL_COMPONENTS.map((component) => [
    component.key,
    { benefitLine: APPROVED_BENEFIT_LINES[component.key] ?? cmoPlaceholder(component.name), complimentary: false }
  ])
) as Record<ProposalComponentKey, ComponentSeed>;

export const templateSeed: TemplateSeed = {
  version: "v1",
  addonName: "Safety Add-on",
  optionsPage: {
    headerLabel: "Proposal · {date}",
    eyebrow: "Prepared for {customerName}",
    title: "Steadier support, right where you need it",
    intro:
      "Thank you for welcoming us into your home. Based on our inspection, here is what we recommend for your bathroom, so every routine stays comfortable and fully in your control. Every price below is installed and final.",
    reassurances: [
      { title: "Mason-trained technicians", body: "Each item placed and tested to suit you." },
      { title: "No renovation", body: "We upgrade your existing bathroom." },
      { title: "Simple pricing", body: "No GST, no hidden charges." }
    ],
    sectionHeading: "Choose your package",
    essentialOptionLabel: "Option A",
    essentialTitle: "Essential Package",
    whatYouGetLabel: "What you get",
    includedLines: ["Installation manpower (Mason-trained technicians)", "Shipping, fittings and materials"],
    complimentaryLabel: "Complimentary",
    addonOptionLabel: "Option B",
    addonTitle: "Essential + {addonName}",
    addonBadge: "Most complete",
    addonLead: "Everything in the Essential Package, plus:",
    addonNote: "The {addonName} is offered as one package and fitted in the same visit.",
    otherRoomsLine: "Other rooms: quoted after inspection."
  },
  essentialPage: {
    eyebrow: "Part 1",
    title: "Essential Package",
    priceSuffix: "installed",
    intro: "Firm handholds and better grip underfoot: support for standing up, stepping into the shower and moving across a wet floor.",
    includedHeading: "Also part of your package",
    included: [
      { title: "Installation manpower", body: "Mason-trained technicians fit every item, then do an inspection and final walkthrough." },
      { title: "Shipping, fittings and materials", body: "Delivery to your home, plus all screws, fittings and materials." }
    ]
  },
  addonPage: {
    eyebrow: "Part 2 · Optional",
    title: "{addonName} Package",
    intro: "Extra safety measures for family peace of mind, added together as one package to your Essential Package.",
    priceStripEssentialLabel: "Essential Package",
    priceStripAddonLabel: "Essential + {addonName}"
  },
  whatHappensNext: [
    { title: "Choose your package", body: "Let us know: Essential, or Essential with the {addonName}." },
    { title: "We book your visit", body: "Installation within 72 hours of your go-ahead, at a time that suits you." },
    { title: "Fitted and explained", body: "Site verification, fitting and final handover, with a walkthrough of every item." }
  ],
  paymentHeading: "Payment",
  paymentTerms: [
    "Due on installation day, before our technician leaves, by secure Razorpay link, UPI, card or cash. No GST is charged; all prices are final."
  ],
  closing: "Questions at any point? Simply reply or call your Mason advisor. We are happy to talk it through with you and your family.",
  signoff: "Warm regards, the Mason Company team",
  footer: "masoncompany.in",
  disclaimer:
    "Mason Company bathroom safety upgrades are preventive support measures. They are not a substitute for diagnosis, treatment, or personalised medical advice. Safety outcomes vary by individual mobility, existing conditions, and home layout. No incident-free outcome can be guaranteed."
};

/** Every string in a value, with its path, for placeholder and emptiness checks. */
function strings(value: unknown, path: string): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => strings(item, `${path}[${index}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, item]) => strings(item, path ? `${path}.${key}` : key));
  return [];
}

const REQUIRED_TEMPLATE_TEXT = [
  "addonName", "optionsPage.headerLabel", "optionsPage.eyebrow", "optionsPage.title", "optionsPage.intro", "optionsPage.sectionHeading",
  "optionsPage.essentialOptionLabel", "optionsPage.essentialTitle", "optionsPage.whatYouGetLabel", "optionsPage.complimentaryLabel",
  "optionsPage.addonOptionLabel", "optionsPage.addonTitle", "optionsPage.addonLead", "optionsPage.otherRoomsLine", "essentialPage.eyebrow",
  "essentialPage.title", "essentialPage.intro", "essentialPage.includedHeading", "addonPage.eyebrow", "addonPage.title", "addonPage.intro",
  "addonPage.priceStripEssentialLabel", "addonPage.priceStripAddonLabel", "paymentHeading", "disclaimer"
];

/** Every problem that stops the seed being written. Empty means it is safe to seed. */
export function seedProblems(components: Record<string, ComponentSeed>, template: TemplateSeed): string[] {
  const problems: string[] = [];
  for (const { key } of PROPOSAL_COMPONENTS) {
    const seed = components[key];
    if (!seed) { problems.push(`component ${key} is missing`); continue; }
    if (!seed.benefitLine?.trim()) problems.push(`component ${key} benefit line is empty`);
    for (const [path, text] of strings(seed, `component ${key}`)) if (text.includes(PENDING)) problems.push(`${path} still holds placeholder copy`);
  }
  for (const extra of Object.keys(components)) {
    if (!PROPOSAL_COMPONENTS.some((component) => component.key === extra)) problems.push(`unknown component ${extra}`);
  }
  if (!/^v\d+$/.test(template.version)) problems.push("template version must look like v1");
  const all = new Map(strings(template, ""));
  for (const path of REQUIRED_TEMPLATE_TEXT) if (!all.get(path)?.trim()) problems.push(`${path} is empty`);
  for (const [path, text] of all) {
    if (text.includes(PENDING)) problems.push(`${path} still holds placeholder copy`);
    if (text.includes(CMO_PLACEHOLDER_PREFIX)) problems.push(`${path} holds a CMO placeholder (only component benefit lines may)`);
    for (const name of unknownPlaceholders(text)) problems.push(`${path} uses unknown placeholder {${name}}`);
  }
  if (template.paymentTerms.length === 0 || template.paymentTerms.some((term) => !term.trim())) problems.push("payment terms are empty");
  if (template.whatHappensNext.length === 0 || template.whatHappensNext.some((item) => !item.title.trim())) problems.push("what-happens-next steps are empty");
  return problems;
}

/** Benefit lines still waiting for the CMO, by component key. */
export function cmoPendingComponents(components: Record<string, ComponentSeed>): string[] {
  return Object.entries(components).filter(([, seed]) => seed.benefitLine.startsWith(CMO_PLACEHOLDER_PREFIX)).map(([key]) => key);
}
