"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HighlightedText from "./HighlightedText";
import type { HomeContent } from "@/lib/cms/model";

gsap.registerPlugin(useGSAP, ScrollTrigger);


export default function Testimonials({ content }: { content: HomeContent["testimonials"] }) {
  const container = useRef<HTMLElement>(null);
  const displayTestimonials = content.items.map((item) => ({ name: item.name, role: item.relation, city: item.city, quote: item.quote }));

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
            {content.eyebrow}
          </span>
          <h2 className="tm-reveal mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-sand-100 sm:text-4xl lg:text-5xl">
            <HighlightedText value={content.heading} accentClassName="font-serif font-normal italic text-forest-200" />
          </h2>
          <p className="tm-reveal mt-4 text-base leading-relaxed text-sand-100/75 sm:text-lg">
            {content.subtitle}
          </p>
        </div>

        {/* Testimonial grid */}
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {displayTestimonials.map((t, i) => (
            <figure
              key={`${t.name}-${i}`}
              className="tm-reveal flex flex-col rounded-3xl bg-sand-50 p-6 sm:p-7"
            >
              <blockquote className="flex-1 text-[15px] leading-relaxed text-cream">
                {t.quote}
              </blockquote>

              <figcaption className="mt-5 flex items-center gap-3 border-t border-sand-200 pt-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-700 font-display text-sm font-bold text-sand-100">
                    {t.name.charAt(0)}
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold leading-tight text-cream">
                      {t.name}
                    </p>
                    <p className="text-xs text-sand-600">
                      {[t.role, t.city].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
