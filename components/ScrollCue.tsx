"use client";

import { smoothScroll } from "./SmoothScroll";

/* "There is more below." A label and a chevron, sitting at the end of a
   section that would otherwise stop at a clean edge.

   It is a real anchor, not a button: it works before hydration, it has a
   target you can see in the status bar, and middle-click or open-in-new-tab do
   the sensible thing. The click handler only upgrades the jump to a smooth
   scroll when Lenis is running — Lenis intercepts the wheel, not anchor
   navigation, so without this the page would jump instantly here and glide
   everywhere else. */

export default function ScrollCue({
  href,
  children,
  className = "",
  tone = "paper",
}: {
  /** In-page target, e.g. "#compare". */
  href: string;
  children: React.ReactNode;
  className?: string;
  /** "green" for the dark-green bands, where paper colours vanish. */
  tone?: "paper" | "green";
}) {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let the browser handle modified clicks and a target that isn't there.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();
    if (smoothScroll.current) {
      smoothScroll.current.scrollTo(target as HTMLElement, { offset: -24 });
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const colour =
    tone === "green"
      ? "text-sand-100/75 hover:text-sand-100"
      : "text-sand-600 hover:text-cream";

  return (
    <a
      href={href}
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 font-mono-label text-[0.7rem] uppercase tracking-[0.18em] transition-colors duration-150 ${colour} ${className}`}
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        /* The nudge is the cue; the hover translate is the response to
           pointing at it. Separate properties (animation vs translate) so the
           two don't overwrite each other. */
        className="h-4 w-4 animate-[cue-nudge_2.4s_ease-in-out_infinite] transition-transform duration-200 group-hover:translate-y-0.5 motion-reduce:animate-none"
      >
        <path
          d="M12 5v14M6 13l6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
