"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PhotoSlot from "./PhotoSlot";
import VisitForm from "./VisitForm";
import type { WhatWeDoSectionContent } from "../content/types";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The turn. Stats ends on the cost of a fall and this answers it — which is
 * why the headline opens on "But". Sits between Stats and WhyMason: fear,
 * relief, then the rational case. Also the page's first dark break.
 *
 * It also now takes the booking. The strip used to end on a button that opened
 * the dialog; the form it opened is small enough to stand in the section
 * instead, so the one place on the page where the promise is stated outright is
 * also the first place you can act on it — without a click in between.
 */
export default function Safer({ content }: { content?: WhatWeDoSectionContent }) {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // set + to, ending in clearProps: a reverted or interrupted .from()
        // strands the lines under their mask and the headline disappears.
        gsap.set(".safer-line", { yPercent: 110 });
        gsap.set(".safer-rise", { y: 28, opacity: 0 });

        gsap
          .timeline({
            defaults: { ease: "power4.out" },
            scrollTrigger: {
              trigger: container.current,
              start: "top 65%",
              once: true,
            },
          })
          .to(".safer-line", {
            yPercent: 0,
            duration: 1,
            stagger: 0.12,
            clearProps: "transform",
          })
          .to(
            ".safer-rise",
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.1,
              ease: "power3.out",
              clearProps: "opacity,transform",
            },
            "-=0.35"
          );
      });
    },
    { scope: container }
  );

  return (
    /* Sized by its padding, not by the viewport. This used to be min-h-screen
       from sm up, and the headline and CTA only come to ~245px — so at desktop
       the section held 278px of flat green above the type and 282px below it,
       the emptiest screen on the page, and it got worse the taller the monitor
       was. The colour change is what makes this read as a break; the height was
       never doing that work. The page's one section rhythm is the statement. */
    <section
      id="free-assessment"
      ref={container}
      className="flex items-center justify-center bg-forest-700 px-6 py-14 sm:py-20 lg:py-24"
    >
      {/* Text first, form second — in the DOM and in both layouts. The headline
          is what earns the form, so it leads whether the two are side by side
          or stacked, and nothing has to be moved out of source order to get
          there. */}
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="text-center lg:text-left">
          {/* Below sm the clamp bottomed out at 32px, where neither sentence
              fit its line — so "safer" and "home" each dropped onto a line of
              their own and the block zigzagged long-tiny-long-tiny. Those two
              words are the whole point of the headline; stranded and centred
              they read as captions instead of the end of a sentence.

              Same fix as the hero: 7.3vw with a wider measure (-mx-2) and
              tighter tracking, so each sentence holds one line and lands on its
              accent word where it was written to.

              The lg step down from 3.5rem is the column: the headline used to
              have the full 1152px to run across and now has half of it beside
              the form, where 56px puts three words on a line and turns two
              sentences into five. */}
          <h2 className="font-display text-[7.3vw] font-extrabold leading-[1.12] tracking-tight text-sand-100 max-sm:-mx-2 max-sm:tracking-[-0.045em] sm:text-[clamp(2rem,5vw,3.5rem)] lg:text-[clamp(1.85rem,2.9vw,2.6rem)]">
            <span className="block overflow-hidden pb-1">
              <span className="safer-line block">
                Make your bathroom <span className="accent-word on-dark">safer</span>
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span className="safer-line block">
                while it still feels like <span className="accent-word on-dark">home</span>
              </span>
            </span>
          </h2>

          {/* white/90 rather than the sand-100 of the headline: a step back
              from it, and still clear of the 4.5:1 floor on forest-700. */}
          <p className="safer-rise mx-auto mt-6 max-w-md text-base leading-relaxed text-white/90 lg:mx-0">
            {content?.description || "Leave your details and a Mason advisor will call to arrange the visit. Full refund any time before installation."}
          </p>

          {/* The column is two short blocks against a form that runs to ~590px,
              so without this the left half is mostly empty green. A person
              rather than a bathroom: every other photo on the page is the work,
              and this is the one section that is about who it is for.

              object-[50%_70%] because the source is a 2:3 portrait and the
              hands — the whole subject — sit low in it. Centred, a wide box
              crops to the forearm and cuts the fingers off. */}
          <PhotoSlot
            src="/prerna/images/care-2.jpg"
            label="An older person at ease at home"
            alt="An older person's hands resting in their lap"
            sizes="(min-width: 1024px) 45vw, (min-width: 640px) 36rem, 100vw"
            position="object-[50%_70%]"
            className="safer-rise mx-auto mt-9 aspect-[16/10] w-full max-w-xl lg:mx-0 lg:max-w-none"
          />
        </div>

        {/* Capped and centred until lg. Below the breakpoint this card has the
            whole 1152px to itself, and a stack of three inputs run to that
            width reads as a page, not a form. */}
        <div className="safer-rise mx-auto w-full max-w-xl lg:max-w-none">
          <VisitForm />
        </div>
      </div>
    </section>
  );
}
