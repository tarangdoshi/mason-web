import Reveal from "./Reveal";
import HighlightedText from "./HighlightedText";
import type { HomeContent } from "@/lib/cms/model";

/* The figure is the thing someone repeats to their sibling that evening, so
   it is rounded to something sayable and the precision moves into the copy
   below it. `prefix` carries a qualifier like "Up to" at a fraction of the
   size — inline rather than on its own line, so one card having it doesn't
   push its label out of step with the other three. */
export default function Stats({ content }: { content: HomeContent["stats"] }) {
  const displayStats = content.cards;
  return (
    <section id="why" className="border-t border-line bg-sand-100 py-14 sm:py-20 lg:py-24">
      <Reveal className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <p className="reveal eyebrow mb-5">{content.eyebrow}</p>
            <h2 className="reveal h-display text-3xl text-cream sm:text-4xl lg:text-5xl">
              <HighlightedText value={content.heading} />
            </h2>
          </div>

          {/* cost figure — deep-brick danger surface.

              This is the cost of a fall, not our price — and it is the only
              large rupee figure on the site, so a skimmer can read it as what
              we charge. A red card (deep muted brick, not the alarm-bright
              brick token) says "cost/loss, not offer" before a word is read;
              the label names it the cost of *doing nothing* and the figure is
              struck through, so it reads as the number you avoid rather than
              one you pay. Kept to label + figure (no extra line) so the card
              stays the height of the heading block it sits level with in the
              items-end row. */}
          <div className="reveal rounded-2xl bg-brick-deep px-7 py-6">
            <p className="text-xs uppercase tracking-[0.16em] text-on-accent/75">
              {content.costLabel}
            </p>
            {/* "Potential ... ₹3L–₹10L" asked the reader to hold a qualifier
                and a range at once. One number they can carry, with the
                qualifier shrunk to the size of the job it does. */}
            <p className="mt-2 font-display text-4xl font-bold text-on-accent lg:text-5xl">
              <span className="mr-2 align-middle text-lg font-semibold text-on-accent/70">
                {content.costPrefix}
              </span>
              {/* Struck through: the whole point is that this is the number
                  you don't pay if the fall never happens. Only the figure is
                  struck, not the "Up to" qualifier. nbsp so a 320px phone
                  breaks after "Up to" rather than stranding "lakh" away from
                  the number. */}
              <span className="align-middle line-through decoration-[3px] decoration-on-accent">
                {content.costFigure.replace(/ (?=\S+$)/, "\u00a0")}
              </span>
            </p>
          </div>
        </div>

        {/* 2×2 on phones so the section doesn't scroll for four full-width
            cells; 4 across from lg. Mobile cells run tighter — less padding,
            a step down in the figure — so two fit a ~360px row without the
            number crowding its own cell. */}
        <div className="reveal mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:mt-14 lg:grid-cols-4">
          {displayStats.map((s, i) => (
            <div
              key={i}
              className="bg-ink-raised p-5 sm:p-7"
            >
              <div className="font-display text-4xl font-bold text-accent sm:text-5xl">
                {s.prefix && (
                  <span className="mr-1.5 align-middle whitespace-nowrap text-base font-semibold text-accent/70 sm:text-xl">
                    {s.prefix}
                  </span>
                )}
                {s.value}
              </div>
              <p className="mt-4 text-sm font-semibold text-cream sm:mt-5">{s.label}</p>
              {/* Hidden on phones: in the 2×2 the figure and label carry the
                  point, and four descriptions there were the bulk of the
                  scroll this pass set out to cut. Back from sm up. */}
              <p className="mt-2 hidden text-sm leading-relaxed text-cream-dim sm:block">
                {s.copy}
              </p>
            </div>
          ))}
        </div>

        <p className="reveal mt-6 text-xs text-cream-faint">
          {content.sourcesNote}
        </p>
      </Reveal>
    </section>
  );
}
