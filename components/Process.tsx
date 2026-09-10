"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Cta from "./Cta";
import type { ProcessSectionContent } from "../content/types";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const steps = [
  {
    title: "Book your package",
    copy: "Choose Standard or Advanced online, request a callback, or call us for guidance.",
  },
  {
    title: "Confirm payment",
    copy: "Pay securely on the website, or receive a payment link from our team after your call.",
  },
  {
    title: "Inspection",
    copy: "We schedule a virtual or physical bathroom inspection depending on location and logistics.",
  },
  {
    title: "Technician visit",
    copy: "Our trained technicians verify the site and finalise support placement.",
  },
  {
    title: "Installation",
    copy: "The selected package is installed with careful fitting, clean execution, and minimal disruption.",
  },
  {
    title: "Success handover",
    copy: "We complete a walkthrough and document the upgrade with before-and-after pictures.",
  },
];

// each tread steps further right — a descending staircase on desktop.
// kept as static strings so Tailwind emits them.
const offset = [
  "lg:ml-0",
  "lg:ml-[7%]",
  "lg:ml-[14%]",
  "lg:ml-[21%]",
  "lg:ml-[28%]",
  "lg:ml-[35%]",
];

function renderTitle(title: string) {
  if (title === "From booking to a safer bathroom.") {
    return (
      <>
        From booking to a <span className="accent-word">safer</span> bathroom.
      </>
    );
  }
  return title;
}

export default function Process({ content }: { content?: ProcessSectionContent }) {
  const ref = useRef<HTMLElement>(null);
  const displaySteps = content?.steps?.length
    ? content.steps.map((step) => ({ title: step.title, copy: step.description }))
    : steps;

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // heading fades in on approach (both breakpoints)
      gsap.from(".proc-head", {
        opacity: 0,
        y: 24,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      });

      const mm = gsap.matchMedia();

      // ---- desktop: pin, and build the staircase step-by-step on scroll ----
      mm.add("(min-width: 1024px)", () => {
        const treads = gsap.utils.toArray<HTMLElement>(".proc-step");
        const countEl = ref.current!.querySelector<HTMLElement>(".proc-count");

        gsap.set(treads, { opacity: 0, y: 36, x: -28 });

        // one beat per step — the counter below reads the step number off it
        const BEAT = 0.6;

        // The flight is built by a paused timeline we drive by hand, rather
        // than a scrubbed one. A scrub binds progress straight to scroll
        // position, so scrolling back up runs the build in reverse; here the
        // staircase is meant to assemble once and stay assembled.
        const tl = gsap.timeline({ paused: true });

        // progress bar spans the flight
        tl.to(
          ".proc-progress",
            { scaleX: 1, ease: "none", duration: displaySteps.length * BEAT },
          0
        );

        /* Each tread arrives and stays at full strength. Earlier this dimmed
           the previous step so only "now" was bright, but the flight is meant
           to be read as it builds — a step you have already passed is still
           part of what the section is showing you, not backdrop. */
        treads.forEach((t, i) => {
          tl.to(
            t,
            { opacity: 1, y: 0, x: 0, duration: 0.5, ease: "power3.out" },
            i * BEAT
          );
        });

        // No pin: a pin holds the section in place for its whole scroll range
        // in both directions, so scrolling back up gets trapped grinding through
        // the pinned zone. Instead the build rides the section's own scroll-
        // through, so scrolling up is just ordinary scrolling past a finished
        // staircase.
        //
        // maxP only ever climbs: we set the timeline to the furthest point
        // scroll has reached, never back. So scrolling down builds the flight,
        // and scrolling back up holds it at its end state instead of undoing
        // it. Fast scrolls still finish it because progress reaches 1.
        let maxP = 0;
        ScrollTrigger.create({
          trigger: ref.current,
          // maps the build across the section's own passage through the
          // viewport, so it starts as the cards rise into view and finishes
          // before they leave the top — no pin, no fixed scroll budget.
          start: "top 80%",
          end: "bottom 20%",
          onUpdate: (self) => {
            if (self.progress > maxP) maxP = self.progress;
            tl.progress(maxP);
            // one beat per step, so the furthest beat reached is the step number
            const n = Math.min(
              displaySteps.length,
              Math.floor((maxP * tl.duration()) / BEAT) + 1
            );
            if (countEl) countEl.textContent = "0" + n;
          },
        });
      });

      // ---- mobile: no pin, simple staggered reveal ----
      mm.add("(max-width: 1023px)", () => {
        gsap.from(".proc-step", {
          opacity: 0,
          y: 24,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: ".proc-stair",
            start: "top 82%",
            once: true,
          },
        });
      });
    },
    { scope: ref }
  );

  return (
    <section
      id="process"
      ref={ref}
      className="border-t border-line bg-sand-100 py-14 sm:py-20 lg:py-0"
    >
      <div className="mx-auto grid h-full max-w-7xl gap-12 px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:px-10 lg:py-24">
        {/* left — heading + live progress */}
        <div>
          <p className="proc-head eyebrow mb-5">Our process</p>
          <h2 className="proc-head h-display text-3xl text-cream sm:text-4xl lg:text-5xl">
            {renderTitle(content?.title || "From booking to a safer bathroom.")}
          </h2>
          <p className="proc-head mt-6 max-w-md text-base leading-relaxed text-cream-dim">
            {content?.subtitle || "Six clear steps, handled by one accountable Mason team - from package booking all the way to final handover."}
          </p>

          {/* Counter and progress rule are desktop instruments: they track the
              pinned lg:h-screen layout as it scrolls. Below lg there is no pin,
              so the count sat frozen at 01 beside a "/ 06" broken over two
              lines, above a rule that never filled — directly on top of the
              same 01–06 printed on every step card. Two readings of the same
              number, one of them inert. */}
          <div className="proc-head mt-8 hidden items-end gap-3 lg:flex">
            <span className="proc-count font-display text-6xl font-bold leading-none text-cream">
              01
            </span>
            <span className="pb-1 text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              / 0{displaySteps.length}
              <br />
              steps
            </span>
          </div>
          <div className="proc-head relative mt-5 hidden h-px w-48 bg-line lg:block">
            <span className="proc-progress absolute inset-y-0 left-0 w-full origin-left scale-x-0 bg-clay" />
          </div>

          {/* Desktop keeps the CTA in the left column, where it sits beside
              the staircase rather than before it. Stacked, that same position
              puts "book now" between the promise of six clear steps and the
              six steps themselves — asking for the decision before showing
              the thing that earns it. */}
          <div className="proc-head mt-8 hidden lg:block">
            <Cta href="#book">{content?.primaryCta || "Book a Safety Visit"}</Cta>
          </div>
        </div>

        {/* right — descending staircase */}
        <div className="proc-stair flex flex-col gap-3 lg:gap-2.5">
          {displaySteps.map((s, i) => (
            <div
              key={s.title}
              className={`proc-step w-full lg:w-[62%] ${offset[i]}`}
            >
              <div className="flex items-start gap-4 rounded-2xl border border-line border-l-2 border-l-clay/50 bg-ink-raised p-4 lg:px-5 lg:py-3.5">
                <span className="font-display text-3xl font-bold leading-none text-cream-dim">
                  0{i + 1}
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-cream lg:text-lg">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-xs leading-snug text-cream-dim">
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
            {content?.primaryCta || "Book a Safety Visit"}
          </Cta>
        </div>
      </div>
    </section>
  );
}
