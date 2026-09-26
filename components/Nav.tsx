"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MasonWordmark } from "./Logo";
import Cta from "./Cta";
import { ArrowForward, Call } from "./Icon";
import { useSiteSettings } from "./SiteSettingsProvider";
import { smoothScroll } from "./SmoothScroll";

const links = [
  { label: "Home", href: "/" },
  { label: "Packages", href: "/packages" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Nav() {
  const { contact } = useSiteSettings();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let queued = false;
    const onScroll = () => {
      // Read scrollY inside rAF rather than in the listener: scroll fires far
      // more often than the screen repaints, and reading layout there is what
      // makes a collapsing bar stutter.
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        // Hysteresis — collapse past 48, expand only back under 12. A single
        // threshold means a page parked right on it flutters between the two
        // states on the smallest movement, and a half-finished 500ms
        // transition reversing is the least smooth thing the bar can do.
        setScrolled((isCollapsed) => (isCollapsed ? y > 12 : y > 48));
        queued = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    // Lenis only owns the wheel — a touch drag is still native scrolling, so
    // the page behind needs locking on the body as well as in Lenis.
    smoothScroll.current?.stop();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const previous = document.activeElement as HTMLElement | null;
    const background = [...(headerRef.current?.parentElement?.querySelectorAll<HTMLElement>("main, footer") || [])];
    const priorInert = background.map(el => el.inert);
    background.forEach(el => {el.inert = true;});
    const focusable = () => [...(headerRef.current?.querySelectorAll<HTMLElement>('a[href], button') || [])].filter(el => el.getClientRects().length);
    headerRef.current?.querySelector<HTMLElement>('[aria-controls="mobile-menu"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const items=focusable(), first=items[0], last=items[items.length-1];
        if (e.shiftKey && document.activeElement===first) {e.preventDefault();last?.focus();}
        else if (!e.shiftKey && document.activeElement===last) {e.preventDefault();first?.focus();}
      }
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      background.forEach((el,i) => {el.inert=priorInert[i];});
      previous?.focus();
      document.body.style.overflow = overflow;
      smoothScroll.current?.start();
    };
  }, [menuOpen]);

  /* One curve for every part of the collapse, so the bar, its inset and the
     wordmark arrive together instead of drifting apart. Slow out, no
     overshoot. */
  const EASE = "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

  /* The home page opens on a full-bleed dark cinematic hero, and while the bar
     is transparent over it the default near-black type is invisible. So at the
     top of "/" the bar switches to light type; the moment it collapses (bg
     fades to pale) it hands back to dark. Colour transitions run on the same
     EASE as the collapse so the two never disagree mid-flight — the flash that
     would otherwise show dark text on the dark photo before the pale bar
     arrives. Only "/" has the hero; every other page keeps the dark type. Not
     while the menu is open: that panel is its own pale surface. */
  const overHero = pathname === "/" && !scrolled && !menuOpen;

  return (
    /* Full-bleed bar sitting on the viewport edge — not an inset pill.
       Named properties, never transition-all: all would animate whatever else
       happened to change, where each of these is something the collapse
       actually touches.

       With the menu open the header stretches to the bottom of the viewport
       and becomes the panel's own frame. Growing the existing element beats
       a separate fixed overlay: the bar stays exactly where it was, so the
       wordmark and the button don't shift by a pixel on open, and the panel
       needs no knowledge of the bar's height. */
    <header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 flex flex-col transition-[background-color,border-color,backdrop-filter] ${EASE} ${
        menuOpen
          ? /* lg:bottom-auto so a phone-width tab widened to desktop with the
               menu still open doesn't leave a full-height header covering the
               page — the panel itself is already lg:hidden. */
            "bottom-0 border-b border-transparent bg-ink lg:bottom-auto"
          : scrolled
            ? "border-b border-line bg-ink/85 backdrop-blur-md"
            : "border-b border-transparent"
      }`}
    >
      {/* The collapse is the bar's height only. Narrowing the measure as well
          would pull the wordmark and CTA inward while the bar around them
          stayed full width, which reads as the content sliding rather than the
          bar shrinking. */}
      <nav
        className={`mx-auto flex w-full max-w-7xl shrink-0 items-center justify-between px-6 transition-[padding] lg:px-10 ${EASE} ${
          scrolled && !menuOpen ? "py-2.5" : "py-4"
        }`}
      >
        {/* Wordmark and links are one group, left. Centring the links looked
            crowded for a reason that centring cannot fix: the right side is a
            number plus a CTA, roughly 390px, against a 110px wordmark, so a
            truly centred middle leaves ~60px before the phone and pools ~360px
            of nothing on the left. Weighting both ends instead puts the empty
            space in the middle, where it reads as air rather than a gap. */}
        <div className="flex items-center gap-10 lg:gap-12">
          <Link
            href="/"
            aria-label="Mason Company - home"
            /* origin-left so the collapse pulls the mark toward the gutter
               rather than shrinking it about its own middle */
            className={`transition-[color,transform] ${EASE} ${
              scrolled && !menuOpen
                ? "origin-left scale-[0.92]"
                : "origin-left scale-100"
            } ${overHero ? "text-white hover:text-accent-soft" : "text-cream hover:text-accent"}`}
          >
            <MasonWordmark size={28} />
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
            {links.map((l) => {
              const current = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={current ? "page" : undefined}
                  className={`text-sm transition-colors ${EASE} ${current ? "font-semibold" : ""} ${
                    overHero
                      ? current ? "text-white" : "text-white/75 hover:text-white"
                      : current ? "text-accent" : "text-cream-dim hover:text-cream"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Number then rule then CTA. The two are a pair — call now, or book a
            visit — and the hairline groups them without adding a second button
            competing with the one that matters. Desktop only: on a phone the
            wrapped two-line CTA plus a call disc left the bar with three
            competing targets and no room for any of them, so both move into
            the panel where each gets a full row. */}
        <div className="hidden items-center gap-3 lg:flex lg:gap-5">
          <a
            href={contact.phoneHref}
            aria-label={`Call Mason Company on ${contact.phoneDisplay}`}
            className={`flex items-center gap-2 text-sm transition-colors ${EASE} ${
              overHero ? "text-white/80 hover:text-white" : "text-cream-dim hover:text-cream"
            }`}
          >
            <Call
              size={16}
              className={`transition-colors ${EASE} ${
                overHero ? "text-accent-soft" : "text-accent"
              }`}
            />
            {/* tabular-nums so the digits sit on an even rhythm rather than
                the proportional spacing the UI face gives them */}
            <span className="tabular-nums">{contact.phoneDisplay}</span>
          </a>

          <span
            aria-hidden="true"
            className={`h-5 w-px transition-colors ${EASE} ${
              overHero ? "bg-white/25" : "bg-line-strong"
            }`}
          />

          <Cta href="/#book" size="compact">
            Book Free Inspection
          </Cta>
        </div>

        {/* Two bars, not three — the third is what makes a hamburger read as
            stock UI, and two rotate into a true X without one line having to
            fade out under the crossing. */}
        {/* Proportions matter more than the count here: 22x8 with a 6px gap,
            so the pair reads as one mark. Wider bars with a 12px gap between
            them read as two stray dashes rather than a menu. */}
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className={`-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${EASE} lg:hidden ${
            overHero ? "text-white hover:text-accent-soft" : "text-cream hover:text-accent"
          }`}
        >
          <span aria-hidden="true" className="relative block h-2 w-[22px]">
            {/* Both bars stay put and animate on translate/rotate alone —
                moving them by `top` instead would jump, since position isn't
                an animatable pair here. 3px is half the distance between the
                two centres, so they meet exactly in the middle. */}
            <span
              className={`absolute left-0 top-0 block h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 block h-0.5 w-full rounded-full bg-current transition-[translate,rotate] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                menuOpen ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </nav>

      {menuOpen && (
        <div
          id="mobile-menu"
          /* data-lenis-prevent for the same reason as the booking sheet:
             Lenis preventDefaults wheel on the window even while stopped, so
             without it this panel cannot be scrolled on a short viewport. */
          data-lenis-prevent
          className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          {/* Links carry the display face at headline size. A phone menu has
              one job and the whole screen to do it in — shrinking these to
              14px nav-bar type would waste the room and make the targets
              worse than the bar they came from. */}
          <ul className="border-t border-line">
            {links.map((l, i) => {
              const current =
                l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href} className="border-b border-line">
                  <Link
                    href={l.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    /* Stagger is 45ms a row: enough to read as a cascade,
                       short enough that the last link is in place well before
                       a thumb could reach it. */
                    style={{ animationDelay: `${60 + i * 45}ms` }}
                    className={`menu-row flex items-center justify-between py-4 font-display text-3xl font-extrabold tracking-tight transition-colors ${
                      current ? "text-accent" : "text-cream"
                    }`}
                  >
                    {l.label}
                    <ArrowForward
                      size={20}
                      className={current ? "text-accent" : "text-cream-faint"}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Pushed to the bottom of whatever height is left, so the two
              actions sit in thumb reach rather than trailing the links. */}
          <div style={{ animationDelay: "260ms" }} className="menu-row mt-auto pt-10">
            {/* Wrapper, not a prop on Cta: this CTA opens the booking dialog
                rather than navigating, so nothing else would ever dismiss the
                panel sitting behind the modal. */}
            <div onClick={() => setMenuOpen(false)}>
              {/* Section size rather than "block": this is the biggest thing
                  on the screen after the links, and block's 14px label would
                  undersell it. w-full only adds the span block gave it. */}
              <Cta href="/#book" className="w-full justify-center">
                Book Free Inspection
              </Cta>
            </div>

            <a
              href={contact.phoneHref}
              aria-label={`Call Mason Company on ${contact.phoneDisplay}`}
              className="mt-4 flex items-center justify-center gap-2.5 py-2 text-cream-dim transition-colors duration-200 hover:text-cream"
            >
              <Call size={17} className="text-accent" />
              <span className="text-base font-semibold tabular-nums">
                {contact.phoneDisplay}
              </span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
