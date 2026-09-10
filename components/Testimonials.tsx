"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const TESTIMONIALS = [
  {
    name: "Anita Mehra",
    role: "Daughter",
    city: "Bengaluru",
    quote:
      "We wanted the bathroom to be safer for my father, but we were worried it would look too clinical. Mason made the space feel more secure without changing the warmth of the home.",
    tag: "Safer movement, premium finish",
  },
  {
    name: "Rohan Kapoor",
    role: "Son",
    city: "Goa",
    quote:
      "The process was clear from the first call. The team explained the package, inspected the bathroom, and installed everything neatly. My mother now has support exactly where she needs it.",
    tag: "Clear process, confident handover",
  },
  {
    name: "Neha Shah",
    role: "Daughter-in-law",
    city: "Bengaluru",
    quote:
      "The biggest relief was not having to coordinate multiple vendors. Mason handled the planning, products, installation, and walkthrough as one complete solution.",
    tag: "One accountable team",
  },
  {
    name: "Vikram Rao",
    role: "Son",
    city: "Goa",
    quote:
      "The before-and-after difference was obvious. The bathroom feels safer, but it still looks like a well-designed home bathroom, not a medical facility.",
    tag: null,
  },
];

export default function Testimonials() {
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
        gsap.set(".tm-reveal", { y: 34, opacity: 0 });
        gsap.to(".tm-reveal", {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.out",
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: container.current,
            start: "top 68%",
            once: true,
          },
        });
      });
    },
    { scope: container }
  );

  return (
    <section
      id="testimonials"
      ref={container}
      /* Sized by its padding — see Doctors. */
      className="flex flex-col overflow-hidden bg-forest-700 px-6 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Header — left-aligned in a max-w-2xl block, matching every other
            section on the page. */}
        <div className="max-w-2xl">
          <span className="tm-reveal block font-sans text-sm font-bold uppercase tracking-[0.35em] text-forest-200">
            Testimonials
          </span>
          <h2 className="tm-reveal mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-sand-100 sm:text-4xl lg:text-5xl">
            What{" "}
            <span className="font-serif font-normal italic text-forest-200">
              families
            </span>{" "}
            say after installation
          </h2>
          <p className="tm-reveal mt-4 text-base leading-relaxed text-sand-100/75 sm:text-lg">
            Families choose Mason Company because the upgrade feels thoughtful,
            premium, and reassuring - not like a temporary hospital setup.
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {TESTIMONIALS.map((t) => (
            <figure
              key={t.name}
              className="tm-reveal flex flex-col rounded-3xl bg-sand-50 p-6 sm:p-7"
            >
              <blockquote className="flex-1 text-[15px] leading-relaxed text-cream">
                {t.quote}
              </blockquote>

              <figcaption className="mt-5 flex items-center justify-between gap-4 border-t border-sand-200 pt-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-700 font-display text-sm font-bold text-sand-100">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold leading-tight text-cream">
                      {t.name}
                    </p>
                    <p className="text-xs text-sand-600">
                      {t.role} &middot; {t.city}
                    </p>
                  </div>
                </div>
                {t.tag && (
                  <span className="hidden shrink-0 rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700 sm:inline-block">
                    {t.tag}
                  </span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
