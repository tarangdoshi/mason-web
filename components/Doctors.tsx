"use client";

import { useRef } from "react";
import { useEditProps } from "./EditModeProvider";
import { DOCS } from "@/lib/cms/edit";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HighlightedText from "./HighlightedText";
import type { HomeContent } from "@/lib/cms/model";

gsap.registerPlugin(useGSAP, ScrollTrigger);



export default function Doctors({ content, disclaimer }: { content: HomeContent["doctors"]; disclaimer: string }) {
  const edit = useEditProps({ ...DOCS.homepage, path: "doctorsSection" });
  const container = useRef<HTMLElement>(null);
  const displayDoctors = content.items.map((item) => ({
    initials: item.name.replace(/^Dr\.?\s+/i, "").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    photo: item.photo,
    name: item.name,
    creds: item.credentials,
    meta: item.meta,
    quote: item.quote
  }));

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // set + to, not .from() with immediateRender:false — that leaves the
        // content sitting in place and then snaps it to the start state the
        // instant the trigger fires, which reads as a jolt as the section
        // arrives. Hiding it up front and animating in avoids the jump;
        // clearProps means nothing is stranded if the tween is interrupted.
        gsap.set(".doc-reveal", { y: 34, opacity: 0 });
        gsap.to(".doc-reveal", {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.12,
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
      id="doctors"
      {...edit}
      ref={container}
      /* border-t like every other sand-100 section: Process is the same
         colour, so without a hairline the two run together and the padding
         between them reads as one section that trailed off rather than two
         that meet. The sections that skip the rule (FAQ, Booking's card) are
         the ones that follow a dark green break, where the colour change is
         the divider. */
      /* Padding sets the height, not the viewport. min-h-screen here only ever
         added slack — the content is already within 30px of a screen at
         861px tall, and on a taller monitor the centring pushed the extra
         height out as dead margin at both ends. */
      className="flex flex-col overflow-hidden border-t border-line bg-sand-100 px-6 py-14 sm:px-10 sm:py-20 lg:px-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        {/* Header — left-aligned in a max-w-2xl block, matching every other
            section on the page. */}
        <div className="max-w-2xl">
          <span className="doc-reveal block font-sans text-sm font-bold uppercase tracking-[0.35em] text-forest-700">
            {content.eyebrow}
          </span>
          <h2 className="doc-reveal mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-4xl lg:text-5xl">
            <HighlightedText value={content.heading} accentClassName="font-serif font-normal italic text-forest-700" />
          </h2>
          <p className="doc-reveal mt-4 max-w-xl text-base leading-relaxed text-sand-600 sm:text-lg">
            {content.subtitle}
          </p>
        </div>

        {/* Doctor cards */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {displayDoctors.map((doc) => (
            <figure
              key={doc.name}
              className="doc-reveal flex flex-col rounded-3xl border border-sand-200 bg-sand-50 p-7"
            >
              <span
                aria-hidden="true"
                className="font-serif text-5xl leading-none text-forest-200"
              >
                &ldquo;
              </span>
              <blockquote className="mt-2 flex-1 text-[15px] leading-relaxed text-cream">
                {doc.quote}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-4 border-t border-sand-200 pt-6">
                {doc.photo ? (
                  <Image
                    src={doc.photo.src}
                    alt={doc.photo.alt || doc.name}
                    width={96}
                    height={96}
                    /* No `sizes`: at "48px" Next served a 48-wide file, which
                       is exactly right for a 1x screen and mush on every other
                       one. Left to width/height it builds a 1x/2x srcset off
                       the 96 instead, so the disc stays sharp on retina. */
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                    style={doc.photo.objectPosition ? { objectPosition: doc.photo.objectPosition } : undefined}
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest-700 font-display text-sm font-bold text-sand-100">
                    {doc.initials}
                  </span>
                )}
                <div>
                  <p className="font-display text-base font-bold leading-tight text-cream">
                    {doc.name}
                  </p>
                  {/* Reserve two lines for the credentials in the 3-up grid —
                      Dr. Rajiv's wrap, and without the reservation the other
                      two captions sit a line higher than his. Stacked on
                      mobile there's nothing to line up against, so no min. */}
                  <p className="mt-0.5 text-xs leading-snug text-sand-600 md:min-h-[2lh]">
                    {doc.creds}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-sand-400">
                    {doc.meta}
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="doc-reveal mt-10 max-w-3xl text-xs leading-relaxed text-sand-400">
          {disclaimer}
        </p>
      </div>
    </section>
  );
}
