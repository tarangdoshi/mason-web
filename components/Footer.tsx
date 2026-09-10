"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MasonWordmark } from "./Logo";
import Cta from "./Cta";
import { CITIES } from "./ServiceArea";
import { CARE_EMAIL } from "./contact-details";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Homepage anchors are absolute (/#packages, not #packages) because this footer
// also renders on /why and /about, where a bare hash would go nowhere. Every
// link here resolves to a real page or a real on-page section — no dead ends.
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Transformations", href: "/#transformations" },
      { label: "Packages", href: "/packages" },
      { label: "What We Install", href: "/packages#kit" },
      { label: "Our Process", href: "/#process" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Why Mason Company", href: "/why" },
      { label: "About Mason Company", href: "/about" },
      { label: "Doctor Recommendations", href: "/#doctors" },
      { label: "Customer Testimonials", href: "/#testimonials" },
      { label: "FAQs", href: "/#faq" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Refund & Cancellation Policy", href: "/refund" },
    ],
  },
];

export default function Footer() {
  const container = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // set + to, not .from() with immediateRender:false — that leaves the
        // content sitting in place and then snaps it to the start state the
        // instant the trigger fires, which reads as a jolt as the section
        // arrives. Hiding it up front and animating in avoids the jump;
        // clearProps means nothing is stranded if the tween is interrupted.
        gsap.set(".ft-reveal", { y: 30, opacity: 0 });
        gsap.to(".ft-reveal", {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: container.current,
            start: "top 78%",
            once: true,
          },
        });
      });
    },
    { scope: container }
  );

  return (
    <footer
      ref={container}
      /* pt matches the section rhythm; pb doesn't, deliberately. Every other
         section's bottom padding is half of a gap to the next section — here
         there is no next section, so 40px below the legal line is the page
         edge, and a matching 80px would just be dead screen. */
      className="bg-cream px-6 pb-10 pt-14 sm:px-10 sm:pt-20 lg:px-16 lg:pt-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Closing CTA */}
        <div className="ft-reveal flex flex-col items-start justify-between gap-8 border-b border-white/10 pb-12 lg:flex-row lg:items-end">
          <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-sand-100 sm:text-4xl lg:text-5xl">
            A safer bathroom, without the{" "}
            <span className="font-serif font-normal italic text-forest-200">
              compromise
            </span>
          </h2>
          <Cta
            href="/#book"
            variant="light"
            className="w-full shrink-0 justify-center sm:w-auto"
          >
            Book a free visit
          </Cta>
        </div>

        {/* Columns */}
        {/* One column below sm. Two columns at 390px leaves each about 155px,
            which is narrower than the link text: "About Mason Company",
            "Doctor Recommendations" and "Refund & Cancellation Policy" each
            broke onto a second line, so the rows lost the even 12px rhythm
            that makes a list scannable and turned into ragged blocks. */}
        <div className="ft-reveal grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              href="/"
              aria-label="Mason Company - home"
              className="inline-block text-sand-100 transition-colors hover:text-forest-200"
            >
              <MasonWordmark size={30} />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-sand-100/60">
              Complete bathroom safety for ageing adults - planned with
              medical input, fitted by trained experts, and finished to feel
              like home.
            </p>
            <a
              href={`mailto:${CARE_EMAIL}`}
              className="mt-5 inline-block text-sm text-sand-100/80 transition-colors hover:text-forest-200"
            >
              {CARE_EMAIL}
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sand-100/50">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-sand-100/80 transition-colors hover:text-forest-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="ft-reveal flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-8 text-xs text-sand-100/50 sm:flex-row sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} Mason Company. All rights
            reserved.
          </p>
          {/* Was "Serving major cities across India" - we install in two. */}
          <p>Installing in {CITIES}, with more cities on the way</p>
        </div>
      </div>
    </footer>
  );
}
