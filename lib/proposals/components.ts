/**
 * The 14 founder-approved Mason components (docs/PRODUCT_CATALOGUE_2026-10-13.md).
 * Names are exact and must not be reworded; keys are stable identifiers shared with
 * mason-api `src/proposals/components.ts`, the Sanity `componentLibrary` documents and
 * the price sheet. Order is the approved display order; defaultQty is the per-package quantity in the catalogue.
 */
export const PROPOSAL_COMPONENTS = [
  { key: "vertical-grab-bars", name: "Vertical grab bars", defaultQty: 3 },
  { key: "angled-grab-bar", name: "L-shaped Shower grab bar", defaultQty: 1 },
  { key: "folding-bar", name: "Flip-up Toilet support bar", defaultQty: 1 },
  { key: "anti-slip-coating", name: "Nanotechnology anti-slip surface treatment", defaultQty: 1 },
  { key: "anti-slip-mat-shower", name: "Shower anti-slip mat", defaultQty: 1 },
  { key: "anti-slip-mat-post-shower", name: "Post-shower anti-slip mat", defaultQty: 1 },
  { key: "raised-toilet-seat", name: "Raised Toilet Seat", defaultQty: 1 },
  { key: "shower-stool", name: "Adjustable Shower seating stool", defaultQty: 1 },
  { key: "two-way-lock", name: "Two-way lock", defaultQty: 1 },
  { key: "corner-safety", name: "Soft Corner Guards", defaultQty: 1 },
  { key: "drainage-solution", name: "Drainage clearance", defaultQty: 4 },
  { key: "slippers-one", name: "EVA non-slip Bathroom slippers", defaultQty: 1 },
  { key: "total-support-solution", name: "Reinforced fixture support", defaultQty: 1 },
  { key: "emergency-key-box", name: "Emergency Key box", defaultQty: 1 }
] as const;

export type ProposalComponentKey = (typeof PROPOSAL_COMPONENTS)[number]["key"];

export const PROPOSAL_COMPONENT_KEYS: readonly ProposalComponentKey[] = PROPOSAL_COMPONENTS.map((item) => item.key);

const NAME_BY_KEY = new Map<string, string>(PROPOSAL_COMPONENTS.map((item) => [item.key, item.name]));

export function proposalComponentName(key: string): string | null {
  return NAME_BY_KEY.get(key) ?? null;
}
