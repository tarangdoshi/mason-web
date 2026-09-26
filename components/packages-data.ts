import { KIT } from "./kit";

/* What separates Standard from Advanced — which is to say, one row out of four.
   Shared by the homepage cards and the /packages comparison table so the offer
   is stated once and cannot drift between the two. */

export type PackageRow = {
  label: string;
  standard: boolean;
  advanced: boolean;
};

export const PACKAGE_ROWS: PackageRow[] = [
  {
    label: `${KIT.length} safety upgrades installed`,
    standard: true,
    advanced: true,
  },
  {
    label: "Installed by trained Mason experts",
    standard: true,
    advanced: true,
  },
  { label: "Inspection and final walkthrough", standard: true, advanced: true },
  { label: "Two-year safety check-up visit", standard: false, advanced: true },
];

export type Package = {
  name: string;
  badge: string;
  /* Identity, not promotion. Fixes which PACKAGE_ROWS column the card reads
     (Advanced gets the check-up row), and which package the advisor treats as
   "the one with the two-year cover". Never flip this to re-style a card. */
  advanced: boolean;
  /* Promotion. Which card gets the bright "Most popular" treatment and leads
     the stack. Independent of `advanced` on purpose, so the promoted card can
     be changed without rewriting either card's feature list. */
  popular: boolean;
  bestFor: string;
  outcome: string;
  referencePrice?: string;
  currentPrice?: string;
};

/* Lives here rather than in Packages.tsx because /packages describes the same
   two packages and must not word them differently. */
export const PACKAGES: Package[] = [
  {
    name: "Standard",
    badge: "The complete kit",
    advanced: false,
    popular: true,
    bestFor:
      "The full safety upgrade, installed, inspected and handed over in one go.",
    outcome:
      "A complete everyday safety upgrade for steadier movement, better grip, and more confidence at home.",
    referencePrice: "₹35,000",
    currentPrice: "₹29,999",
  },
  {
    name: "Advanced",
    badge: "The complete kit, plus two years of cover",
    advanced: true,
    popular: false,
    bestFor:
      "The same installation, with a safety check-up two years on to catch anything that has worked loose.",
    outcome:
      "The same upgrade, looked after - so it stays as safe as the day it was fitted.",
    referencePrice: "₹44,000",
    currentPrice: "₹36,999",
  },
];

export function packageCardFromPlan(plan: { name: string; badge?: string; isFeatured?: boolean; bestFor?: string; outcome?: string; price?: string; referencePrice?: string; currentPrice?: string }, index: number): Package {
  const fallback = PACKAGES[index] || PACKAGES[0];
  return {
    name: plan.name as Package["name"],
    badge: plan.badge || fallback.badge,
    advanced: plan.name === "Advanced",
    popular: Boolean(plan.isFeatured ?? fallback.popular),
    bestFor: plan.bestFor || fallback.bestFor,
    outcome: plan.outcome || fallback.outcome,
    referencePrice: plan.referencePrice || fallback.referencePrice,
    currentPrice: plan.currentPrice || plan.price || fallback.currentPrice
  };
}
