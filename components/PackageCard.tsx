import Link from "next/link";
import Cta from "./Cta";
import AnalyticsViewTracker from "../app/components/analytics-view-tracker";
import type { PackageRow, ResolvedPlan } from "@/lib/cms/model";

/* One package, stated as a card. Shared by the homepage section and /packages
   so the two can't drift — the same offer described two different ways was the
   problem that put this file here.

   Content is shared; only the surface is parameterised. */

type Tone = "paper" | "green";

type Skin = {
  card: string;
  lede: string;
  rule: string;
  rowOn: string;
  rowMid: string;
  rowOff: string;
  mark: string;
  dash: string;
  outcome: string;
  cta: "solid" | "outline" | "outlineLight";
};

/* On paper, both cards are light and the promoted one carries the forest tint.

   On the green section that stops working: two near-white cards on forest-700
   read as equals however the tint is nudged, because both are simply "a light
   card". So the plain one recedes into the green instead — a ghost panel with
   light type, the way Cta's outlineLight variant already handles buttons on
   this surface — and the promoted one stays a solid bright card, which is how
   Testimonials treats cards on forest. Hierarchy comes from the two being
   different kinds of object, not two shades of the same one.

   Takes `popular` (promotion), not `advanced` (identity): the skin follows
   which card is being pushed, not which package has the AMC. */
function skin(tone: Tone, featured: boolean): Skin {
  if (tone === "green" && !featured) {
    return {
      card: "bg-white/[0.16] ring-1 ring-white/40",
      lede: "text-sand-100/85",
      rule: "border-white/30",
      rowOn: "font-semibold text-sand-100",
      rowMid: "text-sand-100/80",
      rowOff: "text-sand-100/55", // the one row that should stay quiet
      mark: "text-forest-200", // accent-soft: the highlight made for dark green
      dash: "bg-white/40",
      outcome: "text-sand-100/70",
      cta: "outlineLight",
    };
  }

  return {
    card: featured
      ? tone === "green"
        ? "bg-sand-50 ring-2 ring-forest-200"
        : "bg-accent-tint ring-2 ring-forest-200"
      : "bg-sand-100",
    lede: "text-cream-dim",
    rule: "border-sand-200",
    rowOn: "font-semibold text-cream",
    rowMid: "text-sand-600",
    rowOff: "text-sand-400",
    mark: "text-forest-700",
    dash: "bg-sand-200",
    outcome: "text-sand-600",
    cta: featured ? "solid" : "outline",
  };
}

export default function PackageCard({
  plan,
  rows,
  popularLabel,
  ctaLabel,
  tone = "paper",
  /** h2 where the card sits under a page h1, h3 under a section h2. */
  headingLevel = 3,
  className = "",
  editAttributes,
}: {
  plan: ResolvedPlan;
  /** Comparison rows shared by both cards (from the Packages page settings). */
  rows: PackageRow[];
  popularLabel: string;
  ctaLabel: string;
  tone?: Tone;
  headingLevel?: 2 | 3;
  className?: string;
  /** `data-sanity` for Sanity Presentation (only passed while previewing drafts). */
  editAttributes?: { "data-sanity"?: string };
}) {
  const pkg = {
    name: plan.name,
    advanced: plan.code === "package-advanced",
    popular: plan.isPopular,
    bestFor: plan.bestFor,
    outcome: plan.outcome,
    currentPrice: plan.price,
    referencePrice: plan.referencePrice
  };
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const s = skin(tone, pkg.popular);
  const light = tone === "green" && !pkg.popular;
  const onHome = tone === "green";

  return (
    <div
      {...editAttributes}
      /* Side by side (lg), both cards share the parent grid's six row tracks
         through subgrid, so header, price, description, the component list
         (and its top rule), outcome and CTA start at the same height in both
         cards whatever the copy length. Stacked below lg, each card is a plain
         column with its natural height. */
      className={`flex flex-col rounded-3xl p-7 lg:row-span-6 lg:grid lg:grid-rows-subgrid lg:gap-y-0 lg:p-9 ${s.card} ${className}`}
    >
      <AnalyticsViewTracker event="view_package" packageName={pkg.name} packagePrice={pkg.currentPrice} />
      {/* items-center, not items-baseline: the pill has its own padding, so
          sitting it on the display type's baseline drops it visibly low.
          leading-none keeps its box tight around the label. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Heading
          className={`h-display text-3xl sm:text-4xl ${
            light ? "text-sand-100" : "text-cream"
          }`}
        >
          {pkg.name}
        </Heading>
        {pkg.popular && (
          <span className="rounded-full bg-forest-700 px-3 py-1.5 text-[0.7rem] font-semibold leading-none text-sand-100">
            {popularLabel}
          </span>
        )}
      </div>

      {(pkg.referencePrice || pkg.currentPrice) && (
        <div className="mt-4 flex items-baseline gap-2.5" aria-label={`${pkg.name} price`}>
          {pkg.currentPrice ? <span className={`h-display text-3xl sm:text-4xl ${light ? "text-sand-100" : "text-cream"}`}>{pkg.currentPrice}</span> : null}
          {pkg.referencePrice ? <span className={`text-lg line-through ${s.rowOff}`}>{pkg.referencePrice}</span> : null}
        </div>
      )}

      <p className={`mt-4 max-w-md text-base leading-relaxed sm:text-lg ${s.lede}`}>
        {pkg.bestFor}
      </p>

      {/* The first row and the one that differs carry the emphasis, the middle
          rows recede, an absence is muted rather than struck through. */}
      <ul className={`mt-7 space-y-3 border-t pt-7 ${s.rule}`}>
        {rows.map((row, i) => {
          const on = pkg.advanced ? row.advanced : row.standard;
          const differentiator = row.standard !== row.advanced;
          return (
            <li key={row.label} className="flex items-start gap-3">
              {on ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 ${s.mark}`}
                >
                  <path
                    d="M5 12.5l4 4 10-10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span
                  aria-hidden="true"
                  className={`mt-2.5 h-0.5 w-4 shrink-0 rounded-full ${s.dash}`}
                />
              )}
              <span
                className={
                  !on
                    ? s.rowOff
                    : differentiator || i === 0
                      ? s.rowOn
                      : s.rowMid
                }
              >
                {row.label}
                {onHome && i === 0 && (
                  <Link href={`/packages/${plan.slug}#components`} className={`ml-2 inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold underline-offset-2 hover:underline ${s.mark}`}>
                    Learn more <span aria-hidden="true">&rarr;</span>
                  </Link>
                )}
              </span>
              <span className="sr-only">
                {on ? "Included" : "Not included"}
              </span>
            </li>
          );
        })}
      </ul>

      <p className={`mt-5 max-w-md text-sm leading-relaxed ${s.outcome}`}>
        {pkg.outcome}
      </p>

      {/* mt-auto so the buttons sit on one line however the copy above wraps */}
      <div className="mt-auto pt-8 lg:mt-0 lg:self-end">
        <Cta packageName={pkg.name} packagePrice={pkg.currentPrice} href={onHome ? `/packages/${plan.slug}` : "#book"} size="block" variant={s.cta}>
          {ctaLabel}
        </Cta>
      </div>
    </div>
  );
}
