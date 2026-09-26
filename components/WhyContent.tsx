"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Reveal from "./Reveal";
import Cta from "./Cta";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// A single bathroom visit, broken into the moments where a fall actually
// happens. This framing (and this copy) lives only on the /why page.
const chain = [
  {
    n: "01",
    name: "Stepping in",
    risk: "A wet threshold and a slick floor - right where there's nothing to hold. Most people's idea of a 'safe bathroom' starts a full metre too late.",
    img: "/prerna/v2-images/hero-after.png",
  },
  {
    n: "02",
    name: "Turning around",
    risk: "Bathrooms are tight. A pivot on wet tile, mid-turn, with nothing within arm's reach - this is where balance quietly gives out.",
    img: "/prerna/images/bath-4.jpg",
  },
  {
    n: "03",
    name: "Sitting & standing",
    risk: "Lowering onto and rising off the toilet is the hardest transfer of the day: knees and hips at their most vulnerable, almost always unwitnessed.",
    img: "/prerna/v2-images/toilet-after.png",
  },
  {
    n: "04",
    name: "Showering",
    risk: "Standing on wet tile, reaching, eyes shut against the soap, balancing on one leg to wash the other. The single highest-risk moment in the house.",
    img: "/prerna/images/shower-2.jpg",
  },
  {
    n: "05",
    name: "The walk back",
    risk: "Half-asleep, in the dark, at 3am. A little disorientation and a floor that's still wet is all a fall ever needs.",
    img: "/prerna/images/bath-6.jpg",
  },
];

const partials = [
  {
    label: "Wait and see",
    copy: "The cheapest plan - until the ambulance. A serious fall averages ₹3–10 lakh and weeks of family coordination, all paid after it's already too late.",
  },
  {
    label: "One grab bar",
    copy: "Covers a single spot, usually at the wrong height, often drilled into hollow tile that won't take the load. Four of the five moments stay untouched.",
  },
  {
    label: "A handyman",
    copy: "Fits what you point at - with no read on how your parent actually moves, no medical logic, no load rating, and no one accountable when it works loose.",
  },
];

export default function WhyContent() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ defaults: { ease: "power3.out" }, delay: 0.1 })
        .from(".why-hero-eyebrow", { opacity: 0, y: 14, duration: 0.6 })
        .from(
          ".why-hero-line",
          { yPercent: 118, duration: 1, stagger: 0.12 },
          "-=0.2"
        )
        .from(".why-hero-sub", { opacity: 0, y: 18, duration: 0.8 }, "-=0.6");

      gsap.to(".why-hero-img", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: ".why-hero-band",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      // each moment in the chain rises in as it's reached
      const items = gsap.utils.toArray<HTMLElement>(".chain-item");
      gsap.set(items, { opacity: 0, y: 34 });
      ScrollTrigger.batch(items, {
        start: "top 85%",
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.12,
          }),
      });
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      {/* ============ THESIS HERO ============ */}
      <section className="mx-auto max-w-7xl px-6 pt-32 pb-16 lg:px-10 lg:pt-44 lg:pb-24">
        <p className="why-hero-eyebrow eyebrow mb-6">Why Mason Company</p>
        <h1 className="h-display max-w-4xl text-[2.6rem] leading-[1.02] text-cream sm:text-6xl lg:text-[5rem]">
          <span className="block overflow-hidden pb-[0.1em]">
            <span className="why-hero-line block">Most safety stops at one grab bar.</span>
          </span>
          <span className="block overflow-hidden pb-[0.1em]">
            <span className="why-hero-line block">
              A fall{" "}
              <span className="accent-word">doesn&rsquo;t</span>.
            </span>
          </span>
        </h1>
        <p className="why-hero-sub mt-8 max-w-2xl text-lg leading-relaxed text-cream-dim">
          A single trip to the bathroom is a chain of risky moments - stepping
          in, turning, sitting, standing, showering, the walk back in the dark.
          Cover five of them and the fall simply finds the sixth. Mason is built
          to cover the whole chain.
        </p>
      </section>

      {/* full-bleed real install band */}
      <div className="why-hero-band relative h-[52vh] overflow-hidden lg:h-[68vh]">
        <div className="why-hero-img absolute inset-x-0 -top-[12%] h-[124%]">
          <Image
            src="/prerna/v2-images/hero-after.png"
            alt="A real Mason bathroom, fully upgraded"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <p className="absolute bottom-6 left-6 max-w-md text-sm font-medium text-white/90 lg:bottom-8 lg:left-10 lg:text-base">
          One real Mason bathroom. Every moment in the chain - covered, on
          purpose.
        </p>
      </div>

      {/* ============ THE CHAIN ============ */}
      <section className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="max-w-2xl">
          <p className="eyebrow mb-5">One visit, five ways to fall</p>
          <h2 className="h-display text-3xl text-cream sm:text-4xl lg:text-5xl">
            Walk through it <span className="accent-word">moment by moment</span>.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-cream-dim">
            This is the same trip your parent makes several times a day. Here is
            where each one turns dangerous - and why a single fix can&rsquo;t
            hold it together.
          </p>
        </div>

        <div className="mt-16">
          {chain.map((m, i) => (
            <div key={m.n} className="chain-item flex gap-5 lg:gap-8">
              {/* node + connecting line */}
              <div className="flex flex-col items-center">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent font-display text-sm font-bold text-white shadow-sm">
                  {m.n}
                </span>
                {i < chain.length - 1 && (
                  <span className="mt-2 w-px flex-1 bg-line-strong" />
                )}
              </div>

              {/* content */}
              <div className="pb-14 lg:pb-20">
                <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-10">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      The risk
                    </span>
                    <h3 className="mt-3 font-display text-2xl font-semibold text-cream lg:text-3xl">
                      {m.name}
                    </h3>
                    <p className="mt-3 max-w-md text-base leading-relaxed text-cream-dim">
                      {m.risk}
                    </p>
                  </div>
                  <div className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-line">
                    <Image
                      src={m.img}
                      alt={m.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      className="object-cover transition-transform duration-700 hover:scale-[1.04]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ THE GAP / HALF-MEASURES ============ */}
      <section className="border-t border-line bg-surface">
        <Reveal className="mx-auto max-w-6xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="reveal max-w-2xl">
            <p className="eyebrow mb-5">Why half-measures fail</p>
            <h2 className="h-display text-3xl text-cream sm:text-4xl lg:text-5xl">
              The <span className="accent-word">gap</span> is where the fall
              happens.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-cream-dim">
              Every partial fix leaves part of the chain uncovered. The fall
              doesn&rsquo;t care which part.
            </p>
          </div>

          {/* the partial approaches */}
          <div className="reveal mt-14 divide-y divide-line border-y border-line">
            {partials.map((p) => (
              <div
                key={p.label}
                className="grid gap-2 py-7 lg:grid-cols-[0.5fr_1.5fr] lg:items-baseline lg:gap-10"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-semibold text-cream lg:text-2xl">
                    {p.label}
                  </span>
                  <span className="rounded-full border border-line-strong px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-cream-faint">
                    Leaves a gap
                  </span>
                </div>
                <p className="max-w-xl text-base leading-relaxed text-cream-dim">
                  {p.copy}
                </p>
              </div>
            ))}
          </div>

          {/* the Mason answer */}
          <div className="reveal mt-10 overflow-hidden rounded-2xl bg-accent-muted px-7 py-9 text-white lg:px-12 lg:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              The whole chain
            </p>
            <h3 className="mt-3 max-w-3xl font-display text-2xl font-semibold leading-snug lg:text-[2rem]">
              The Mason system covers every moment, not just the easy one.
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/85">
              Every moment assessed. Placement shaped by doctor input. Load-rated,
              PVD-coated hardware. Installed and owned end to end by one
              accountable team - and finished so the bathroom still feels like
              home, not a hospital.
            </p>
            <Cta href="/#book" variant="light" className="mt-8">
              Book Free Inspection
            </Cta>
          </div>
        </Reveal>
      </section>

      {/* ============ CLOSING CTA ============ */}
      <section className="border-t border-line">
        <Reveal className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-10 lg:py-32">
          <h2 className="reveal mx-auto max-w-3xl h-display text-3xl leading-[1.08] text-cream sm:text-4xl lg:text-5xl">
            Don&rsquo;t leave a link in the chain to{" "}
            <span className="accent-word">chance</span>.
          </h2>
          {/* Stacked full-width below sm — same reason as the hero's pair. */}
          <div className="reveal mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
            <Cta href="/#book" className="w-full justify-center sm:w-auto">
              Book Free Inspection
            </Cta>
            <Cta
              href="/#packages"
              variant="outline"
              className="w-full justify-center sm:w-auto"
            >
              See the packages
            </Cta>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
