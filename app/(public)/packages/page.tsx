import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import ScrollCue from "@/components/ScrollCue";
import PhotoSlot from "@/components/PhotoSlot";
import VisitForm from "@/components/VisitForm";
import PackageCard from "@/components/PackageCard";
import PackageAdvisor from "@/components/PackageAdvisor";
import { KIT } from "@/components/kit";
import { getHomepageContentData } from "@/lib/site-content";
import { packageCardFromPlan } from "@/components/packages-data";

export const metadata: Metadata = {
  alternates: {canonical: "https://www.masoncompany.in/packages"},
  title: "Packages - Mason Company",
  description:
    "Book a free bathroom safety visit, or choose Standard or Advanced outright. Both install the same 12 upgrades, fitted by trained Mason experts.",
};

/* Three blocks, in the order the decision is actually made.

   The page used to open by naming the kit and only reached a booking form six
   sections later, on the assumption that the reader arrives ready to compare.
   Most don't - they arrive not knowing what their bathroom needs, which is the
   thing an assessment answers and a comparison table cannot. So the free visit
   is the offer at the top and the form is on screen with it; the two packages
   are the alternative for the reader who has already decided; and the kit list
   is the evidence under both, stated once because both packages install it.

   Surfaces alternate - sunken, paper, sunken - so each hand-off is a colour
   change rather than a gap, and nothing bottoms out on empty paper. */

export default async function PackagesPage() {
  const content = await getHomepageContentData();
  const packages = content.packagesSection.plans.map(packageCardFromPlan);
  return (
    <>
      <Nav />
      <main>
        {/* ---------- 1. BOOK THE VISIT ----------
            Headline left, form right, on the sunken surface so the sand-50
            card lifts off it. Text before form in the DOM and in both layouts:
            the headline is what earns the form. */}
        <section className="border-b border-line bg-sand-100 px-6 pt-24 pb-14 lg:px-10 lg:pt-28 lg:pb-20">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow mb-4">Free &amp; no obligation</p>
              {/* The lg step down from text-6xl is the column: the h1 has half
                  the page beside the form, and 60px there puts three words on
                  a line. */}
              <h1 className="h-display text-4xl text-cream sm:text-5xl lg:text-[clamp(2.5rem,3.8vw,3.5rem)]">
                Book a bathroom <span className="accent-word">safety</span>{" "}
                visit.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-cream-dim sm:text-lg">
                We walk the bathroom with you first, then recommend Standard or
                Advanced. Full refund before the technician arrives or starts implementation.
              </p>

              {/* Directly under the sentence it answers, not under the photo.
                  Below the picture it landed at ~790px on a 1440x900 laptop -
                  on the fold line, under the heaviest element on the page, and
                  the one reader it exists for (already decided, doesn't want
                  the visit) never saw it. Here it is the next thing after
                  "Standard or Advanced", which is the moment the question
                  occurs to them. */}
              <ScrollCue href="#packages" className="mt-6">
                Or choose a package now
              </ScrollCue>

              {/* Two short blocks against a form that runs past 600px, so
                  without a picture the left half is mostly empty paper - the
                  same problem, and the same fix, as the Safer strip. */}
              <PhotoSlot
                src="/prerna/images/bath-2.jpg"
                label="A finished bathroom, grab rail fitted"
                alt="A bathroom after a Mason safety install"
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 36rem, 100vw"
                /* Above the fold and the page's LCP - without this it waits
                   in the lazy queue behind the form. */
                priority
                className="mt-8 aspect-[16/10] w-full max-w-xl lg:max-w-none"
              />
            </div>

            {/* The ring is the page's, not the form's: VisitForm also sits on
                forest green in the Safer strip, where a hairline would be
                invisible. Same radius as the card it wraps, no padding, so the
                stroke lands exactly on its edge. */}
            <div className="mx-auto w-full max-w-xl rounded-3xl ring-1 ring-line lg:max-w-none">
              <VisitForm />
            </div>
          </div>
        </section>

        {/* ---------- 2. THE TWO PACKAGES ----------
            For the reader who has decided already. A label and a hairline
            rather than a heading - the cards carry their own h2s, and a
            section title above them would be a third name for the same
            thing. */}
        <section
          id="packages"
          className="mx-auto max-w-7xl px-6 py-14 lg:px-10 lg:py-20"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-sand-200 pb-4">
            <p className="eyebrow">Choose a package</p>
            <p className="eyebrow">Same for both packages</p>
          </div>

          <Reveal className="mt-8">
            <div className="grid gap-6 lg:grid-cols-2">
              {packages.map((p) => (
                <PackageCard
                  key={p.name}
                  pkg={p}
                  headingLevel={2}
                  /* Featured first in the single-column stack - same as the
                     homepage section, so the two never disagree about which
                     package leads. */
                  className={`reveal ${p.popular ? "order-first lg:order-none" : ""}`}
                />
              ))}
            </div>
          </Reveal>

          {/* The cards are for the reader who has decided; this is for the one
              who cannot, and it lifts off the paper the way the VisitForm card
              does on the sunken surface above. */}
          <Reveal className="mt-6">
            <div className="reveal">
              <PackageAdvisor />
            </div>
          </Reveal>

          <div className="mt-8">
            <ScrollCue href="#kit">See what gets installed</ScrollCue>
          </div>
        </section>

        {/* ---------- 3. WHAT WE INSTALL ----------
            Sunken again, and stated once: the list is identical in both
            packages, so printing it per card would only invite the reader to
            hunt for the difference between two identical columns.

            Every row carries the thing itself and how many of it turn up. Two
            columns rather than three: a photograph, a title that runs to
            "Toilet seat / raised seat / commode support" and a count need
            about 570px between them, and at three across the titles broke to
            three lines each and the rows grew taller than the ones they were
            meant to save space over. */}
        <section
          id="kit"
          className="border-t border-line bg-sand-100 px-6 py-14 lg:px-10 lg:py-20"
        >
          <Reveal className="mx-auto max-w-7xl">
            <div className="reveal flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
              {/* The chip is the section's real h2, styled as a label - it is
                  a count, and set as display type it would compete with the
                  h1 for the page. */}
              <h2 className="inline-flex items-center rounded-full border border-dashed border-forest-200 bg-accent-tint px-4 py-2 font-mono-label text-[0.7rem] uppercase tracking-[0.18em] text-forest-700">
                What we install &middot; {KIT.length}
              </h2>
              <p className="eyebrow">Identical in both packages</p>
            </div>

            {/* Grid rather than columns so a title that wraps lifts its whole
                row and the hairlines stay level across the gutter. */}
            <ul className="reveal mt-8 grid lg:grid-cols-2 lg:gap-x-14">
              {KIT.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center gap-4 border-b border-dashed border-sand-200 py-3"
                >
                  {/* alt is empty on purpose - the title sits right beside it,
                      so a screen reader would otherwise hear it twice. */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg sm:h-14 sm:w-14">
                    <Image
                      src={item.img}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-mono-label text-[0.6rem] uppercase tracking-[0.18em] text-sand-400">
                      {item.label}
                    </p>
                    <h3 className="text-sm leading-snug font-semibold text-cream sm:text-base">
                      {item.title}
                    </h3>
                  </div>

                  {/* The count. Tabular figures and a fixed min-width so a 1
                      and a 12 sit on the same right edge down the column
                      rather than shuffling by a digit. */}
                  <span
                    aria-hidden="true"
                    className="min-w-9 shrink-0 rounded-full bg-sand-200 px-2.5 py-1 text-center font-mono-label text-sm tabular-nums text-cream"
                  >
                    {item.qty}
                  </span>
                  <span className="sr-only">
                    {item.qty} included
                  </span>
                </li>
              ))}
            </ul>

            <p className="reveal mt-8 max-w-lg text-sm leading-relaxed text-sand-600">
              All {KIT.length} are fitted, tested and handed over on the same
              visit - there is no shorter version of the kit.
            </p>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
