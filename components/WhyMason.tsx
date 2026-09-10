"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { smoothScroll } from "./SmoothScroll";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const reasons = [
  {
    title: "Comprehensive by design",
    copy: "We look at the full bathroom routine: entry, turning, sitting, standing, showering, and night-time use.",
    tag: "The whole routine",
  },
  {
    title: "Doctor-informed planning",
    copy: "Our approach is shaped with doctor inputs, preventive mobility guidance, and senior-care context.",
    tag: "Medically shaped",
  },
  {
    title: "Trained Mason experts",
    copy: "Every visit is handled by trained technicians who understand support placement and secure fitting.",
    tag: "Skilled hands",
  },
  {
    title: "One accountable team",
    copy: "From selection to inspection, installation, and follow-up, Mason stays responsible for the outcome.",
    tag: "Owned end to end",
  },
  {
    title: "Premium, home-first finish",
    copy: "Built to feel calm and considered - not hospital-like or temporary.",
    tag: "Still feels like home",
  },
  {
    title: "Evidence-led prevention",
    copy: "We study fall-risk patterns and assisted-care environments to design practical home upgrades.",
    tag: "Grounded in evidence",
  },
];

// DOM grid order (row-major): 0 1 2 / 3 4 5  ->  TL TM TR / BL BM BR
// Outside-in deal order: corners first, middle column lands last.
// rank[domIndex] = when that card deals (0 = first, 5 = last)
const dealRank = [0, 4, 1, 3, 5, 2]; // TL,TR,BR,BL first; TM,BM last
const flightRot = [-9, 7, -6, 8, -4, 5]; // per-rank tilt while stacked

export default function WhyMason() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // heading entrance
      gsap.from(".wm-reveal", {
        opacity: 0,
        y: 26,
        duration: 1,
        ease: "power3.out",
        stagger: 0.09,
        scrollTrigger: { trigger: ref.current, start: "top 82%", once: true },
      });

      const mm = gsap.matchMedia();

      // ---- desktop: stack in the centre, deal outward into a 3x2 grid as the
      //      pinned section scrolls — forwards only ----
      mm.add("(min-width: 1024px)", () => {
        const grid = ref.current!.querySelector<HTMLElement>(".wm-grid")!;
        const cards = gsap.utils.toArray<HTMLElement>(".wm-card");

        // offset from each card's centre to the grid centre (= stacked position)
        const dx = (el: HTMLElement) =>
          grid.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
        const dy = (el: HTMLElement) =>
          grid.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2);

        // top of the stack (deals first) sits above the rest
        cards.forEach((el, i) =>
          gsap.set(el, { zIndex: 10 + (cards.length - dealRank[i]) })
        );

        /* Paused, and driven by hand below rather than handed to ScrollTrigger
           as a scrubbed animation. The deal still tracks the pinned scroll
           exactly as it did — that part was right, and it is what keeps the
           cards from opening before you have arrived at the section. What was
           wrong is only that a scrub is symmetric: running the scroll backwards
           ran the deal backwards and collected the cards into the stack again. */
        const tl = gsap.timeline({
          paused: true,
          defaults: { ease: "power3.out" },
        });

        cards.forEach((el, i) => {
          const rank = dealRank[i];
          const at = rank * 0.13; // sequence the deal
          tl.fromTo(
            el,
            {
              x: () => dx(el),
              y: () => dy(el),
              rotation: flightRot[rank],
              scale: 0.82,
            },
            { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.55, immediateRender: true },
            at
          ).fromTo(
            el.querySelector(".wm-card-text"),
            { autoAlpha: 0, y: 12 },
            { autoAlpha: 1, y: 0, duration: 0.3, immediateRender: true },
            at + 0.4
          );
        });

        /* The one-way playhead. `furthest` is the deepest the scroll has ever
           taken the deal, and the timeline is only ever moved to that — so
           scrolling back up through the pin leaves every card where it landed
           and the section can be read at leisure.

           quickTo rather than a new tween each frame: it retargets a single
           tween, which is the mechanism scrub uses internally, and gives back
           the half-second catch-up that `scrub: 1` had. Without it the cards
           would track the scroll rigidly and the deal would feel snappier
           than the one being replaced. */
        const playhead = { p: 0 };
        const scrubTo = gsap.quickTo(playhead, "p", {
          duration: 0.5,
          ease: "power3",
          onUpdate: () => tl.progress(playhead.p),
        });
        let furthest = 0;

        /* Back to the 1700px it always held. The deal is scrubbed across the
           pin, so the pin's length *is* the speed the cards open at — cutting
           it to one screen made them open roughly twice as fast, which is not
           a separate bug from the shortening, it is the shortening. */
        let released = false;

        /* Releasing the pin drops its 1700px spacer, which would throw the
           scroll position 1700px down the page. It doesn't, because a section
           pinned at start + k renders exactly like an unpinned one at start —
           identical pixels — so putting the scroll back to start cancels the
           spacer out. Both happen in one synchronous block, so the browser
           only ever paints the corrected position. */
        const release = (st: ScrollTrigger) => {
          released = true;
          const y = st.start;
          st.kill();
          const lenis = smoothScroll.current;
          if (lenis) lenis.scrollTo(y, { immediate: true });
          else window.scrollTo(0, y);
          ScrollTrigger.refresh();
        };

        ScrollTrigger.create({
          trigger: ref.current,
          start: "top top",
          /* Back to the 1700px it always held. The deal is scrubbed across the
             pin, so the pin's length *is* the speed the cards open at — cutting
             it to one screen didn't just shorten the hold, it made the cards
             open twice as fast. Those are the same knob, not two. */
          end: "+=1700",
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            if (self.progress > furthest) {
              furthest = self.progress;
              scrubTo(furthest);
              return;
            }

            /* Reversed. Freezing the deal exactly where it stood strands
               whichever cards were still in flight — mid-air, at 0.98 scale,
               with their text still faded out — and that is the state the
               section keeps until you scroll down through the pin again. So
               a genuine reversal finishes the deal instead. The 0.04 margin
               is there because scroll jitters by a pixel constantly, and
               without it the first stray frame would count as going back. */
            if (furthest > 0 && furthest < 1 && self.progress < furthest - 0.04) {
              furthest = 1;
              scrubTo(1);
            }

            /* And once it is done, the pin has nothing left to show going up,
               so it stops charging scroll for it. A pin costs the same
               distance in both directions; with a one-way animation behind it
               the whole 1700px was dead screen on the way back — the second
               or so of feeling stuck. Making the pin one-way too is what lets
               the deal keep its full 1700px going down. */
            if (!released && furthest >= 1 && self.direction === -1) {
              release(self);
            }
          },
          /* A resize changes the grid, and the stacked position is measured
             from it. invalidate() drops the recorded offsets so the next
             render measures again; re-setting progress is what forces that
             render, since the playhead itself hasn't moved. */
          onRefresh: () => {
            tl.invalidate();
            tl.progress(playhead.p);
          },
        });
      });

      // ---- mobile: plain grid, gentle fade-up ----
      mm.add("(max-width: 1023px)", () => {
        gsap.from(".wm-card", {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ".wm-grid", start: "top 80%", once: true },
        });
      });
    },
    { scope: ref }
  );

  return (
    <section
      ref={ref}
      className="border-t border-line bg-sand-100 py-14 sm:py-20 lg:h-screen lg:overflow-hidden lg:py-0"
    >
      {/* lg padding lives here rather than on the section, because the section
          is the viewport and this is what sits inside it. Same py-24 as every
          other section — top equal to bottom. */}
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-6 lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <p className="wm-reveal eyebrow mb-5">Why Mason Company</p>
          <h2 className="wm-reveal h-display text-3xl text-cream sm:text-4xl lg:text-[2.75rem]">
            A complete <span className="accent-word">solution</span> - not
            a pile of products.
          </h2>
          <p className="wm-reveal mt-5 max-w-xl text-base leading-relaxed text-cream-dim">
            Six strengths that come together into one accountable outcome.
          </p>
        </div>

        {/* deck → 3x2 grid */}
        {/* lg:mt-10 rather than lg:mt-0 — the grid had no space under the sub
            copy at all, and the rows stretch to whatever is left rather than
            being centred at a fixed height. Centring two 240px rows inside the
            420px that remains on a 787px viewport overflowed by 76px, and
            content-center splits an overflow evenly: 38px pushed up under the
            sub copy, 38px clipped off the bottom by overflow-hidden. Letting
            the rows divide the space means the cards fit any viewport and grow
            on a tall one, instead of being a fixed height that only happens to
            fit at 861px. */}
        <div className="wm-grid relative mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex-1 lg:grid-cols-3">
          {reasons.map((r, i) => (
            <article
              key={r.title}
              /* lg:min-h-0 hands the height back to the grid row. The 220px
                 floor is a mobile concern, where each card is its own row and
                 nothing else sets a height; at lg it was fighting the row it
                 sits in and winning, which is what caused the overflow. */
              /* justify-center centres each card's content in its own height,
                 which reads fine on mobile where every card is its own row, but
                 across a desktop row of equal-height cells it drifts the shorter
                 cards down — a two-line card's eyebrow sits below a three-line
                 one's. lg:justify-start tops them all to the same line. */
              className="wm-card flex min-h-[220px] flex-col justify-center rounded-2xl border border-line bg-ink-raised p-7 will-change-transform lg:min-h-0 lg:justify-start"
            >
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cream-faint">
                {r.tag}
              </span>

              <div className="wm-card-text mt-4">
                <h3 className="font-display text-xl font-semibold text-cream">
                  {r.title}
                </h3>
                <p
                  className="mt-2.5 text-sm leading-relaxed text-cream-dim"
                  dangerouslySetInnerHTML={{ __html: r.copy }}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
