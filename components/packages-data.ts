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
  { label: "One-year safety check-up visit", standard: false, advanced: true },
];

export type Package = {
  name: string;
  badge: string;
  /* Identity, not promotion. Fixes which PACKAGE_ROWS column the card reads
     (Advanced gets the check-up row), and which package the advisor treats as
     "the one with the year-on cover". Never flip this to re-style a card. */
  advanced: boolean;
  /* Promotion. Which card gets the bright "Most popular" treatment and leads
     the stack. Independent of `advanced` on purpose, so the promoted card can
     be changed without rewriting either card's feature list. */
  popular: boolean;
  bestFor: string;
  outcome: string;
  cta: string;
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
    cta: "Book Standard",
  },
  {
    name: "Advanced",
    badge: "The complete kit, plus a year of cover",
    advanced: true,
    popular: false,
    bestFor:
      "The same installation, with a safety check-up a year on to catch anything that has worked loose.",
    outcome:
      "The same upgrade, looked after - so it stays as safe as the day it was fitted.",
    cta: "Book Advanced",
  },
];
