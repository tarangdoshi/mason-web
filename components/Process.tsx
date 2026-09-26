import Cta from "./Cta";
import { serverEditProps } from "@/lib/cms/edit-server";
import { DOCS } from "@/lib/cms/edit";
import AnalyticsViewTracker from "../app/components/analytics-view-tracker";
import { SERVICE_NAMES } from "../lib/analytics";
import HighlightedText from "./HighlightedText";
import type { HomeContent } from "@/lib/cms/model";


// each tread steps further right — a descending staircase on desktop.
// kept as static strings so Tailwind emits them. With three treads the
// spread widens so the staircase still spans the column.
const offset = ["lg:ml-0", "lg:ml-[19%]", "lg:ml-[38%]"];

export default async function Process({ content }: { content: HomeContent["process"] }) {
  const edit = await serverEditProps({ ...DOCS.homepage, path: "processSection" });
  const displaySteps = content.steps.map((step) => ({ title: step.title, copy: step.description }));

  return (
    <section
      id="process"
      {...edit}
      className="border-t border-line bg-sand-100 py-14 sm:py-20 lg:py-0"
    >
      <AnalyticsViewTracker event="view_service" serviceName={SERVICE_NAMES.safetyAssessment} />
      <div className="mx-auto grid h-full max-w-7xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:px-10 lg:py-24">
        {/* left — heading + step count */}
        <div>
          <p className="eyebrow mb-5">{content.eyebrow}</p>
          <h2 className="h-display text-3xl text-cream sm:text-4xl lg:text-5xl">
            <HighlightedText value={content.heading} />
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-cream-dim lg:mt-6">
            {content.subtitle}
          </p>

          {/* Desktop-only count. It used to tick up as the staircase built on
              scroll; with the build removed it reads as a static summary — three
              steps, all shown — rather than a stuck instrument. */}
          <div className="mt-8 hidden items-end gap-3 lg:flex">
            <span className="font-display text-6xl font-bold leading-none text-cream">
              0{displaySteps.length}
            </span>
            <span className="pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              / 0{displaySteps.length}
              <br />
              steps
            </span>
          </div>
          <div className="mt-5 hidden h-px w-48 bg-clay lg:block" />

          {/* Desktop keeps the CTA in the left column, where it sits beside
              the staircase rather than before it. Stacked, that same position
              puts "book now" between the promise of three clear steps and the
              steps themselves — asking for the decision before showing
              the thing that earns it. */}
          <div className="mt-8 hidden lg:block">
            <Cta href="#book">{content.ctaLabel}</Cta>
          </div>
        </div>

        {/* right — descending staircase. With three treads instead of six the
            cards carry more padding and the gap widens, so the column stays
            balanced against the left rather than collapsing to a short stub. */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {displaySteps.map((s, i) => (
            <div key={s.title} className={`w-full lg:w-[62%] ${offset[Math.min(i, offset.length - 1)]}`}>
              <div className="flex h-full items-start gap-4 rounded-2xl border border-line border-l-2 border-l-clay/50 bg-ink-raised p-4 lg:min-h-[8rem] lg:gap-5 lg:px-6 lg:py-4">
                <span className="font-display text-3xl font-bold leading-none text-cream-dim lg:text-4xl">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-cream lg:text-xl">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-cream-dim">
                    {s.copy}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Below lg only — a third grid child, so the gap-12 rhythm carries it
            without a margin of its own. Two elements rather than one moved by
            order: the CTA belongs inside the left column on desktop, and a
            single element cannot be both a child of that column and a sibling
            of the staircase. */}
        <div className="lg:hidden">
          <Cta href="#book" className="w-full justify-center sm:w-auto">
            {content.ctaLabel}
          </Cta>
        </div>
      </div>
    </section>
  );
}
