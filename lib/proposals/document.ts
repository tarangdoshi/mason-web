import type { TemplateSeed } from "../../content/proposals/seed";
import { CMO_PLACEHOLDER_PREFIX } from "./placeholders";
import { proposalComponentName, PROPOSAL_COMPONENT_KEYS, type ProposalComponentKey } from "./components";

/* The customer-facing proposal document (3 A4 pages), built from the API's proposal view plus the Sanity copy.
   One pure builder feeds the customer page /p/[token], the staff "Show family" view and the browser PDF,
   so all three always show the same thing. */

/** Approved disclaimer (20 Nov copy). Shown if the template's is ever blank: the disclaimer is never omitted. */
export const APPROVED_DISCLAIMER =
  "Mason Company bathroom safety upgrades are preventive support measures. They are not a substitute for diagnosis, treatment, or personalised medical advice. Safety outcomes vary by individual mobility, existing conditions, and home layout. No incident-free outcome can be guaranteed.";

export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

/** mason-api `GET /api/v1/public/proposals/:token` → `data` (docs/proposals.md). */
export type ProposalViewItem = {
  component: string;
  name?: string;
  state: "recommended" | "present" | "declined";
  tier: "essential" | "addon";
  qty: number;
  variant: string | null;
  complimentary: boolean;
};
export type ProposalView = {
  displayName: string;
  proposalDate: string;
  rooms: number;
  status: string;
  totals: { essentialPaise: number | null; addonPaise: number | null };
  items: ProposalViewItem[];
};

export type TemplateContent = TemplateSeed;
export type ComponentContent = { benefitLine?: string | null; photoUrl?: string | null };
export type ProposalContent = { template: TemplateContent; components: Partial<Record<string, ComponentContent>> };

export type DocItem = {
  key: ProposalComponentKey;
  name: string;
  qty: number;
  /** e.g. "1 short, 1 long"; null when no item carries a variant. */
  variants: string | null;
  benefit: string | null;
  photoUrl: string | null;
  complimentary: boolean;
};

export type ProposalDoc = {
  customerName: string;
  date: string; // YYYY-MM-DD, for the PDF filename
  dateLabel: string; // "20 November 2026"
  essentialPrice: string;
  addonPrice: string | null;
  addonName: string;
  essential: DocItem[]; // charged essential items, in approved order
  complimentary: DocItem[];
  addon: DocItem[];
  copy: TemplateContent; // placeholders filled
  disclaimer: string;
  /** Components whose benefit line is not written yet (left blank on the page, flagged to staff). */
  missingBenefitLines: string[];
};

/** "₹13,999": Indian digit grouping, done by hand so server and browser render identical text. */
export function formatPrice(paise: number): string {
  const rupees = Math.round(paise / 100);
  const digits = String(Math.abs(rupees));
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rupees < 0 ? "-" : ""}₹${rest ? `${rest},${last3}` : last3}`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-11-20" → "20 November 2026" (no time zone involved). */
export function formatProposalDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? ""} ${match[1]}`;
}

/** PDF filename: never the customer name. */
export function pdfFilename(date: string): string {
  return `Mason-Proposal-${/^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "proposal"}.pdf`;
}

function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? values[name] : whole));
}

function fillAll<T>(value: T, values: Record<string, string>): T {
  if (typeof value === "string") return fill(value, values) as T;
  if (Array.isArray(value)) return value.map((item) => fillAll(item, values)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillAll(item, values)])) as T;
  return value;
}

const usable = (text: string | null | undefined): string | null => {
  const trimmed = text?.trim();
  return trimmed && !trimmed.startsWith(CMO_PLACEHOLDER_PREFIX) ? trimmed : null;
};

/** "1 short, 1 long" from the rows of one component; null when none has a variant. */
export function variantSummary(rows: Pick<ProposalViewItem, "qty" | "variant">[]): string | null {
  if (!rows.some((row) => row.variant?.trim())) return null;
  return rows.map((row) => `${row.qty} ${(row.variant?.trim() || "standard").toLowerCase()}`).join(", ");
}

/** Recommended rows grouped per component (a component can appear once per variant), in approved order. */
function group(rows: ProposalViewItem[], content: ProposalContent["components"], missing: Set<string>): DocItem[] {
  const byKey = new Map<string, ProposalViewItem[]>();
  for (const row of rows) byKey.set(row.component, [...(byKey.get(row.component) ?? []), row]);
  const ordered = [...byKey.keys()].sort((a, b) => PROPOSAL_COMPONENT_KEYS.indexOf(a as ProposalComponentKey) - PROPOSAL_COMPONENT_KEYS.indexOf(b as ProposalComponentKey));
  return ordered.map((key) => {
    const list = byKey.get(key)!;
    const library = content[key];
    const benefit = usable(library?.benefitLine);
    if (!benefit) missing.add(key);
    return {
      key: key as ProposalComponentKey,
      name: proposalComponentName(key) ?? list[0].name ?? key, // canonical name always wins
      qty: list.reduce((sum, row) => sum + row.qty, 0),
      variants: variantSummary(list),
      benefit,
      photoUrl: library?.photoUrl ?? null,
      complimentary: list.every((row) => row.complimentary)
    };
  });
}

export function buildProposalDoc(view: ProposalView, content: ProposalContent): ProposalDoc {
  if (view.totals.essentialPaise === null) throw new Error("The proposal is not priced.");
  const recommended = view.items.filter((item) => item.state === "recommended" && proposalComponentName(item.component) !== null);
  const missing = new Set<string>();
  const essentialAll = group(recommended.filter((item) => item.tier === "essential"), content.components, missing);
  const addon = view.totals.addonPaise === null ? [] : group(recommended.filter((item) => item.tier === "addon"), content.components, missing);
  const essentialPrice = formatPrice(view.totals.essentialPaise);
  const addonPrice = view.totals.addonPaise === null || addon.length === 0 ? null : formatPrice(view.totals.addonPaise);
  const addonName = content.template.addonName?.trim() || "Safety Add-on";
  const dateLabel = formatProposalDate(view.proposalDate);
  const values = { customerName: view.displayName.trim(), date: dateLabel, essentialPrice, addonPrice: addonPrice ?? "", addonName };
  const copy = fillAll(content.template, values);
  return {
    customerName: values.customerName,
    date: view.proposalDate,
    dateLabel,
    essentialPrice,
    addonPrice,
    addonName,
    essential: essentialAll.filter((item) => !item.complimentary),
    complimentary: essentialAll.filter((item) => item.complimentary),
    addon: addonPrice ? addon : [],
    copy,
    disclaimer: copy.disclaimer?.trim() || APPROVED_DISCLAIMER,
    missingBenefitLines: [...missing].map((key) => proposalComponentName(key) ?? key)
  };
}

/** Lines in the Option A card (items, always-included lines, complimentary items). Above this the
    document uses a compact density so the approved 3 A4 pages still hold everything. */
export const COMPACT_ABOVE_LINES = 9;

export function documentDensity(doc: ProposalDoc): "regular" | "compact" {
  const optionA = doc.essential.length + doc.complimentary.length + doc.copy.optionsPage.includedLines.length;
  const optionB = doc.addon.length + 1;
  const cards = doc.essential.length + doc.complimentary.length;
  return optionA > COMPACT_ABOVE_LINES || optionB > COMPACT_ABOVE_LINES || cards > 6 || doc.addon.length > 6 ? "compact" : "regular";
}

/** Page-1 list line: "Vertical grab bars × 2 (1 short, 1 long)". */
export function optionLine(item: DocItem): string {
  return `${item.name}${item.qty > 1 ? ` × ${item.qty}` : ""}${item.variants ? ` (${item.variants})` : ""}`;
}

/** Page-2/3 card body: "1 short and 1 long. Support at key standing and movement points." */
export function cardBody(item: DocItem): string {
  const parts = item.variants?.split(", ") ?? [];
  const variants = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
  return [variants ? `${variants}.` : null, item.benefit].filter(Boolean).join(" ");
}

/* ---------- Staff side: the same view shape from GET /internal/proposals/:id ---------- */

type PricedLine = { component: string; variant: string | null; complimentary: boolean };
export type StaffProposal = {
  displayName: string;
  proposalDate?: string | null;
  rooms: number;
  status: string;
  items: { component: string; state: ProposalViewItem["state"]; tier: ProposalViewItem["tier"]; qty: number; variant?: string | null }[];
  priceSnapshot?: { lines?: PricedLine[] } | null;
  essentialTotalPaise: number | null;
  addonTotalPaise: number | null;
  override?: { essentialPaise?: number; addonPaise?: number } | null;
};

/** Mirrors mason-api `publicView`: priced lines pair positionally with the recommended items; override applied. */
export function viewFromStaffProposal(proposal: StaffProposal, fallbackDate: string): ProposalView {
  const lines = proposal.priceSnapshot?.lines ?? [];
  let next = 0;
  const items = proposal.items.map((item) => {
    const candidate = item.state === "recommended" ? lines[next] : undefined;
    const line = candidate && candidate.component === item.component ? candidate : undefined;
    if (line) next += 1;
    return { component: item.component, state: item.state, tier: item.tier, qty: item.qty, variant: line?.variant ?? item.variant ?? null, complimentary: line?.complimentary ?? false };
  });
  const override = proposal.override ?? null;
  return {
    displayName: proposal.displayName,
    proposalDate: proposal.proposalDate ?? fallbackDate,
    rooms: proposal.rooms,
    status: proposal.status.toLowerCase(),
    totals: {
      essentialPaise: override?.essentialPaise ?? proposal.essentialTotalPaise,
      addonPaise: proposal.addonTotalPaise === null ? null : (override?.addonPaise ?? proposal.addonTotalPaise)
    },
    items
  };
}

/** Minimal shape check of the public view before it reaches the page. */
export function isProposalView(value: unknown): value is ProposalView {
  const view = value as ProposalView | null;
  return Boolean(
    view && typeof view.displayName === "string" && typeof view.proposalDate === "string" && Array.isArray(view.items) &&
      view.totals && (typeof view.totals.essentialPaise === "number" || view.totals.essentialPaise === null)
  );
}
