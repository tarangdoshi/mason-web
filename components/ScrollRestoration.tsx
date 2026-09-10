"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { smoothScroll } from "./SmoothScroll";

/* Scroll-position memory across route changes.

   Lenis (see SmoothScroll) lives in the root layout, so it survives client-side
   navigation and it — not the browser — owns the scroll position. That means the
   browser's own back/forward scroll restoration never takes effect: press back
   from a footer link and you land at the top of the hero instead of where you
   left. This restores it.

   We save the scroll position per pathname as the user scrolls, and on a
   back/forward navigation (a popstate) we scroll Lenis back to the saved spot.
   Restoration is gated on popstate on purpose: a forward click — "Home" in the
   nav, a footer link, an anchor like /#book — still behaves normally and lands
   at the top or the anchor. Only "coming back" returns you to where you were. */

const KEY = "mason:scroll-positions";

function readPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function writePositions(map: Record<string, number>) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(map));
  } catch {}
}

export default function ScrollRestoration() {
  const pathname = usePathname();
  // True only for the window between a back/forward press and the route settling.
  const isPop = useRef(false);

  // Take over restoration from the browser, and keep a per-path record of where
  // the reader is. The scroll listener keys off window.location.pathname (not the
  // React value) so the position is always filed under the URL actually showing.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const onPop = () => {
      isPop.current = true;
      // Safety net: if the popstate was a hash-only change (no pathname change,
      // so the restore effect below never runs), don't let the flag leak into
      // the next forward navigation.
      window.setTimeout(() => {
        isPop.current = false;
      }, 200);
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const map = readPositions();
        map[window.location.pathname] = window.scrollY;
        writePositions(map);
      });
    };

    window.addEventListener("popstate", onPop);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // On a back/forward navigation, put the reader back where they were.
  useEffect(() => {
    if (!isPop.current) return;
    isPop.current = false;

    const y = readPositions()[pathname];
    if (y == null) return;

    // The destination keeps growing after mount — images decode, fonts swap, and
    // GSAP ScrollTrigger builds pinned sections — so an early scroll gets clamped
    // short of a deep target (like the footer). We chase it: each frame recompute
    // Lenis's scroll limit and re-apply, until we've actually reached the target
    // or a time budget runs out. A real user gesture aborts, so we never fight
    // someone who starts scrolling during the restore.
    const started = performance.now();
    let hits = 0;
    let id = 0;
    let aborted = false;

    const abort = () => {
      aborted = true;
    };
    const opts = { passive: true, once: true } as const;
    window.addEventListener("wheel", abort, opts);
    window.addEventListener("touchstart", abort, opts);
    window.addEventListener("keydown", abort, opts);

    const apply = () => {
      if (aborted) return;
      const lenis = smoothScroll.current;
      if (lenis) {
        lenis.resize(); // pick up the taller layout so the target isn't clamped
        lenis.scrollTo(y, { immediate: true, force: true });
      } else {
        window.scrollTo(0, y);
      }
      const reached = Math.abs(window.scrollY - y) <= 2;
      const elapsed = performance.now() - started;
      // Stop once we've held the target for a couple of frames, but give a heavy
      // page up to 2s to finish growing before we let go.
      if ((reached && ++hits >= 3) || elapsed > 2000) return;
      id = requestAnimationFrame(apply);
    };
    id = requestAnimationFrame(apply);

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("wheel", abort);
      window.removeEventListener("touchstart", abort);
      window.removeEventListener("keydown", abort);
    };
  }, [pathname]);

  return null;
}
