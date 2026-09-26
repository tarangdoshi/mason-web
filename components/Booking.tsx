import Image from "next/image";
import { serverEditProps } from "@/lib/cms/edit-server";
import { DOCS } from "@/lib/cms/edit";
import Reveal from "./Reveal";
import Cta from "./Cta";
import HighlightedText from "./HighlightedText";
import type { HomeContent } from "@/lib/cms/model";


export default async function Booking({ content }: { content: HomeContent["finalCta"] }) {
  const edit = await serverEditProps({ ...DOCS.homepage, path: "finalCtaSection" });
  /* Full-bleed below sm. The inset card is a desktop device: it needs margin
     around it to read as a card, and at 390px the 24px gutter and 24px radius
     are too small to do that — they just shave the photograph and leave a
     hairline nobody reads as a frame. Edge to edge, the image becomes the
     surface instead of sitting on one, which is the only treatment on the page
     that can hold a whole screen on its own. */
  return (
    <section
      id="book"
      {...edit}
      /* py-0 below sm is the full-bleed card, not a gap — from sm up this
         picks up the page's section rhythm like everything else. */
      className="border-t border-line bg-sand-100 px-0 py-0 sm:px-6 sm:py-20 lg:px-10 lg:py-24"
    >
      <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-none border-0 sm:rounded-3xl sm:border sm:border-line">
        {/* background image */}
        <Image
          src={content.image.src}
          alt={content.image.alt}
          fill
          sizes="100vw"
          className="object-cover"
        />
        {/* Ink at 38% UNDER the green, not over it. The green wash only lets
            38% of the photo through, so darkening what it sits on mutes the
            highlights without touching the hue — over the top it would just
            grey the green out, which is the tint the section is built on.

            This is what was hurting readability, and the vignette below is why
            it went unnoticed: it is transparent through the middle 50% and
            only darkens the edges, so every line of type sat on the brightest,
            busiest part of the photograph with no help at all. Measured over
            the lit tiles: white was 3.62:1 and the paragraph at white/80 was
            2.91:1 — both under the 4.5:1 body-text floor. With the scrim they
            are 5.46:1 and 4.78:1. */}
        <div className="absolute inset-0 bg-[rgba(11,9,8,0.38)]" />
        {/* accent-muted wash at ~62% so the real bathroom still reads */}
        <div className="absolute inset-0 bg-accent-muted/[0.62]" />
        {/* dark edge vignette — shape, not legibility; the scrim above does that */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_45%,transparent_50%,rgba(11,9,8,0.6))]" />

        {/* min-h-svh with the content centred in it: one full screen, and the
            padding stops setting the height. svh rather than dvh so it doesn't
            grow and shrink as the phone's toolbars collapse. From sm it goes
            back to being sized by its own padding. */}
        <div className="relative flex min-h-svh flex-col justify-center px-6 py-12 text-center sm:block sm:min-h-0 sm:px-12 sm:py-14 lg:py-16">
          <p className="reveal eyebrow on-dark mb-6">{content.eyebrow}</p>
          <h2 className="reveal mx-auto max-w-3xl h-display text-4xl leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            <HighlightedText value={content.heading} accentClassName="accent-word on-dark" />
          </h2>
          {/* white/90, not /80: the last 10% is the difference between 4.28:1
              and 4.78:1 over the lit part of the photo, and costs nothing —
              the paragraph still sits back from the headline's full white. */}
          <p className="reveal mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            {/* Was "choose a package or request a callback", written when there
                were two buttons here to choose between. One of them opens the
                same sheet as the other, so the sentence was offering a fork
                that did not exist. */}
            {content.subtitle}
          </p>

          {/* One button, because there was only ever one action. The pair here
              read as a choice - a solid "Book Free Inspection" beside an outline
              "Request a Callback" - and both opened the identical sheet. A
              choice that resolves to the same screen either way costs the
              reader a decision and returns nothing for it. */}
          <div className="reveal mt-9 flex justify-center">
            <Cta href="#book" className="w-full justify-center sm:w-auto">
              {content.ctaLabel}
            </Cta>
          </div>

          {/* mt-8 below sm, not mt-10: the reassurance list is the least of the
              five blocks and the first place to find room when the whole thing
              has to hold one screen. */}
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 sm:mt-10">
            {content.badges.map((c) => (
              <span
                key={c}
                /* Same again, and it matters more here: 12px text needs the
                   4.5:1 floor as much as body copy does, and has less ink to
                   carry it. */
                className="flex items-center gap-2 text-xs text-white/90"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5l4 4 10-10"
                    stroke="#e6f3ef"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {c}
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
