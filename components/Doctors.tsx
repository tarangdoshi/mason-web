"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { DoctorAttestationContent } from "../content/types";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/* `photo` is optional: a doctor who has one gets their face in the caption,
   and the rest keep the initials disc, which is the same 12x12 circle. Both
   sit in the same slot, so a card gaining a photo later doesn't move. */
const DOCTORS: {
  initials: string;
  photo?: string;
  name: string;
  creds: string;
  meta: string;
  quote: string;
}[] = [
  {
    initials: "AG",
    photo: "/prerna/images/dr-ashok-gupta.jpg",
    name: "Dr. Ashok Gupta",
    creds: "MBBS (UCMS), MRSH (London)",
    meta: "40+ years of experience",
    quote:
      "For ageing adults, bathroom safety should focus on predictable support: standing, turning, sitting, bathing, and moving across wet areas. A well-planned home upgrade can support safer daily routines without making the space feel institutional.",
  },
  {
    initials: "RG",
    photo: "/prerna/images/dr-rajiv-goyal.jpg",
    name: "Dr. Rajiv Goyal",
    creds: "MBBS, MD - Dermatology, Venereology & Leprosy",
    meta: "Dermatologist · 22 years overall experience",
    quote:
      "Good preventive design respects both safety and dignity. The right bathroom changes should reduce avoidable risk while still feeling comfortable, clean, and appropriate for the home.",
  },
  {
    initials: "PG",
    photo: "/prerna/images/dr-prerna-goyal.jpg",
    name: "Dr. Prerna Goyal",
    creds: "MBBS, DMRD, DNB",
    meta: "Radiologist · MAMC, Delhi University",
    quote:
      "Fall prevention begins with understanding daily movement. Support placement, slip-risk reduction, visibility, and ease of use all matter when designing safer spaces for older adults.",
  },
];

export default function Doctors({ items }: { items?: DoctorAttestationContent[] }) {
  const container = useRef<HTMLElement>(null);
  const displayDoctors = items?.length
    ? items.slice(0, 3).map((item) => ({
        initials: item.doctorName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
        photo: item.photo?.src?.startsWith("/images/proof/doctor-")
          ? DOCTORS.find((doctor) => doctor.name === item.doctorName)?.photo
          : item.photo?.src || DOCTORS.find((doctor) => doctor.name === item.doctorName)?.photo,
        name: item.doctorName,
        creds: item.specialty,
        meta: item.registration,
        quote: item.quote
      }))
    : DOCTORS;

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
            Doctor-Reviewed
          </span>
          <h2 className="doc-reveal mt-4 font-display text-3xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-4xl lg:text-5xl">
            Doctor-Reviewed{" "}
            <span className="font-serif font-normal italic text-forest-700">
              safety thinking
            </span>
          </h2>
          <p className="doc-reveal mt-4 max-w-xl text-base leading-relaxed text-sand-600 sm:text-lg">
            Medical input helps us plan safer routines. Mason-trained experts
            make the solution feel premium at home.
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
                    src={doc.photo}
                    alt={doc.name}
                    width={96}
                    height={96}
                    /* No `sizes`: at "48px" Next served a 48-wide file, which
                       is exactly right for a 1x screen and mush on every other
                       one. Left to width/height it builds a 1x/2x srcset off
                       the 96 instead, so the disc stays sharp on retina. */
                    className={`h-12 w-12 shrink-0 rounded-full object-cover ${doc.name === "Dr. Prerna Goyal" ? "object-[50%_22%]" : ""}`}
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
          Doctor inputs are used for preventive safety planning and product
          approach. Mason Company does not provide medical treatment or
          guarantee fall-free outcomes.
        </p>
      </div>
    </section>
  );
}
