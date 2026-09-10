"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { smoothScroll } from "./SmoothScroll";
import { ChevronLeft, ChevronRight } from "./Icon";
import { KIT } from "./kit";

/** px of travel before we decide whether a gesture is the rail's or the page's */
const DIRECTION_THRESHOLD = 6;

export default function ProductRail() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const drag = useRef({
    down: false,
    locked: false,
    startX: 0,
    startY: 0,
    startScroll: 0,
  });

  useGSAP(() => {
    gsap.from(".rail-card", {
      opacity: 0,
      y: 36,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.06,
      delay: 0.45,
    });
  });

  const updateBar = () => {
    const el = scrollerRef.current;
    const bar = barRef.current;
    if (!el || !bar) return;
    const max = el.scrollWidth - el.clientWidth;
    bar.style.transform = `translateX(${(max > 0 ? el.scrollLeft / max : 0) * 300}%)`;
  };

  const page = (dir: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // A gesture belongs to the rail OR to the page, never both. We watch the first
  // few pixels, decide which way it's going, and only then take it over — a
  // drag that starts vertical is handed straight back so the page scrolls.
  //
  // Touch is excluded: the browser does it better. This handler writes
  // scrollLeft once per pointermove, which tracks the finger but stops dead the
  // instant it lifts — no flick, no momentum, no rubber-band at the ends. Those
  // are the things that make a rail feel like a rail on a phone, and none of
  // them can be faked convincingly from a move handler. A mouse has no flick to
  // lose, so click-drag on desktop still comes through here.
  const onDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || e.pointerType === "touch") return;
    drag.current = {
      down: true,
      locked: false,
      startX: e.clientX,
      startY: e.clientY,
      startScroll: el.scrollLeft,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || !drag.current.down) return;

    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;

    if (!drag.current.locked) {
      if (Math.abs(dx) < DIRECTION_THRESHOLD && Math.abs(dy) < DIRECTION_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current.down = false; // vertical intent - let the page have it
        return;
      }
      drag.current.locked = true;
      el.setPointerCapture(e.pointerId);
      // stop the page mid-flight, or Lenis keeps easing while we drag sideways
      smoothScroll.current?.stop();
    }

    e.preventDefault();
    el.scrollLeft = drag.current.startScroll - dx;
  };

  const onUp = () => {
    if (drag.current.locked) smoothScroll.current?.start();
    drag.current.down = false;
    drag.current.locked = false;
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 lg:px-10">
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={updateBar}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          /* overscroll-x-contain: hitting either end must not chain the scroll
             up to the page.

             touch-auto, where this used to say touch-pan-y: the browser now
             owns both axes on touch, which is what buys the momentum and the
             rubber-band. It can do that safely because the rail has no vertical
             overflow of its own, so a vertical swipe over it still scrolls the
             page.

             Snapping is desktop-only. Proximity snap plus a drag that ends
             abruptly is what made this move a card at a time: you let go, and
             the rail stepped to the nearest card start rather than coasting to
             where you left it. On a pointer it is still worth having, because
             the arrows page by 80% of the width and snap tidies where they
             land. */
          className="flex cursor-grab touch-auto gap-4 overflow-x-auto overscroll-x-contain pb-1 [scroll-snap-type:none] [scrollbar-width:none] select-none active:cursor-grabbing sm:[scroll-snap-type:x_proximity] [&::-webkit-scrollbar]:hidden"
        >
        {KIT.map((it) => (
          <article
            key={it.title}
            /* Shorter cards below sm: 35vh is 295px on a 844px phone, and the
               hero needs those 25px back to fit one screen. The 3/4 aspect
               means height also sets how many cards you see, and at 32vh you
               still get a card and a half — enough to read as a rail. */
            className="rail-card group relative aspect-[3/4] h-[clamp(200px,35vh,370px)] shrink-0 overflow-hidden rounded-xl [scroll-snap-align:start] max-sm:h-[clamp(180px,32vh,300px)]"
          >
            <Image
              src={it.img}
              alt={it.title}
              fill
              draggable={false}
              sizes="260px"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            {/* bottom scrim — dark ramp; keeps the photograph readable under the label */}
            <div className="photo-scrim absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="font-mono-label text-[0.65rem] uppercase tracking-[0.18em] text-white/70">
                {it.label}
              </span>
              <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-white">
                {it.title}
              </h3>
            </div>
          </article>
        ))}
        </div>

        {/* Arrows overlaid on the card edges, vertically centred — desktop
            only. On a phone the rail is already swipeable, so the discs buy
            nothing and cost a lot: at that card width they cover a third of
            the photo either side and sit right across the label. A pointer
            has no swipe, which is the only reason they exist at all. */}
        <button
          onClick={() => page(-1)}
          aria-label="Previous"
          className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-ink/60 text-cream-dim backdrop-blur-sm transition-colors duration-150 hover:bg-ink/85 sm:grid lg:left-4"
        >
          <ChevronLeft />
        </button>
        <button
          onClick={() => page(1)}
          aria-label="Next"
          className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line-strong bg-ink/60 text-cream-dim backdrop-blur-sm transition-colors duration-150 hover:bg-ink/85 sm:grid lg:right-4"
        >
          <ChevronRight />
        </button>
      </div>

      {/* progress bar centred below */}
      <div className="mx-auto mt-4 h-[3px] w-40 overflow-hidden rounded-full bg-line sm:mt-6">
        <div
          ref={barRef}
          className="h-full w-1/3 rounded-full bg-cream-dim transition-transform duration-100 ease-out"
        />
      </div>
    </div>
  );
}
