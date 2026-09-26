"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Cta from "./Cta";
import HighlightedText from "./HighlightedText";
import type { HomeContent } from "@/lib/cms/model";

/* The full-bleed backdrop. A real Mason install — a fitter fixing a grab bar
   while the parents look on. Two crops of the same scene, art-directed by a
   <picture>: a landscape frame on desktop (subject right, bare wall left for the
   headline to sit over), and a portrait frame on mobile where the whole scene
   fits a tall viewport without cropping the couple out. The <picture> media
   query means the browser downloads only the crop it needs, not both. */
const BACKGROUND = {
  /** below lg — portrait, fills a tall phone screen */
  mobile: "/prerna/images/hero-install-portrait.jpg",
  /** lg and up — landscape, subject to the right of the headline */
  desktop: "/prerna/images/hero-install.jpg",
};

/** The lg breakpoint (1024px), where the layout switches to the left-aligned
    split — the same point we switch to the landscape crop. */
const DESKTOP_MEDIA = "(min-width: 1024px)";

/* Sentences sit on their own line from lg (the left-aligned split); below lg
   they flow as one balanced run. An explicit line break in the CMS heading
   overrides the sentence split. */
function heroLines(text: string) {
  return text.includes("\n") ? text : text.split(/(?<=[.!?])\s+/).join("\n");
}

export default function Hero({ content }: { content: HomeContent["hero"] }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Reduced motion sets nothing, so every element renders at its CSS value.
      // set + to, never .from(): an interrupted .from() strands the element at
      // opacity 0.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // A slow push-in on the backdrop — the room coming into focus. The
        // section clips the 1.08 overscale.
        gsap.set(".hero-bg", { scale: 1.08 });
        gsap.to(".hero-bg", { scale: 1, duration: 2.6, ease: "power2.out" });

        gsap.set(".hero-rise", { opacity: 0, y: 24 });
        gsap.to(".hero-rise", {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.2,
          clearProps: "opacity,transform",
        });
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden text-white"
    >
      {/* full-bleed backdrop + left-heavy scrim */}
      <div aria-hidden="true" className="hero-bg absolute inset-0 -z-20">
        <picture>
          <source media={DESKTOP_MEDIA} srcSet={BACKGROUND.desktop} />
          <img
            src={BACKGROUND.mobile}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
      </div>
      <div
        aria-hidden="true"
        className="hero-cine-scrim pointer-events-none absolute inset-0 -z-10"
      />

      {/* TEXT band, vertically centred in the fold. The standard site container
          keeps the headline's left edge flush with every other section. */}
      <div className="flex flex-1 items-center pt-24 pb-16 sm:pt-28">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
          {/* Centred while stacked (below lg); left-aligned on wider screens. */}
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-4xl lg:text-left">
            {/* Below lg the two sentences flow as one run so text-balance can
                even out the centred lines. The deliberate two-line split
                returns at lg, where it's left-aligned. */}
            <h1 className="hero-rise text-balance font-display text-[9vw] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-5xl sm:leading-[1.02] lg:text-6xl">
              <HighlightedText
                value={{ ...content.heading, text: heroLines(content.heading.text) }}
                accentClassName="accent-word on-dark"
                renderLine={(line, index) => (
                  <>
                    {index > 0 ? " " : null}
                    <span className="lg:block">{line}</span>
                  </>
                )}
              />
            </h1>

            <p className="hero-rise mx-auto mt-5 max-w-md text-base leading-relaxed text-white/75 sm:mt-6 sm:text-lg lg:mx-0">
              {content.subcopy}
            </p>

            <div className="hero-rise mt-9 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:justify-center sm:items-center lg:justify-start">
              <Cta href="#book" arrow={false} className="w-full justify-center sm:w-auto">
                {content.primaryCta}
              </Cta>
              <Cta
                href="#transformations"
                variant="outlineLight"
                arrow={false}
                className="w-full justify-center sm:w-auto"
              >
                {content.secondaryCta}
              </Cta>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
