import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Cta from "@/components/Cta";
import Reveal from "@/components/Reveal";
import PhotoSlot from "@/components/PhotoSlot";
import HighlightedText from "@/components/HighlightedText";
import { getPublicSiteContent } from "@/lib/cms/load";
import { serverEditProps } from "@/lib/cms/edit-server";
import { DOCS } from "@/lib/cms/edit";
import { cmsMetadata } from "@/lib/cms/seo";

/* Content comes from Sanity (Studio → About); published changes appear within a minute. */
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("about", {
    alternates: {canonical: "https://www.masoncompany.in/about"},
    title: "About Us - Mason Company",
    description:
      "Mason Company was started so families would not have to wait for a fall. Premium, doctor-informed bathroom safety upgrades for ageing parents in Indian homes.",
  });
}

/* This page carries more words than any other on the site, so the job is to
   stop it reading as a wall.

   Two rules run through it. No section repeats the shape of the one above —
   sticky-column narrative, then a dark band, then cards, then a scannable
   grid — so the eye always knows it has moved. And wherever the copy already
   has a list inside a sentence (the refusals, the bathroom routine, the three
   goals), that list is set as a list, because a reader will scan ten short
   labels and skip the same ten buried in prose. */

export default async function AboutPage() {
  const { about } = await getPublicSiteContent();
  const edit = await serverEditProps(DOCS.about);
  const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return (
    <>
      <Nav />
      <main {...edit}>
        {/* ---- hero ---- */}
        <section className="mx-auto max-w-7xl px-6 pt-32 pb-8 lg:px-10 lg:pt-40 lg:pb-16">
          <p className="eyebrow mb-6">{about.hero.eyebrow}</p>
          <h1 className="h-display max-w-4xl text-[2.4rem] leading-[1.04] text-cream sm:text-5xl lg:text-[4rem]">
            <HighlightedText value={about.hero.heading} />
          </h1>

          {/* Two columns rather than one long measure — the hero carries two
              paragraphs, and stacked they would push the fold down a screen. */}
          <div className="mt-5 grid max-w-4xl gap-2 lg:mt-10 lg:grid-cols-2 lg:gap-12">
            {about.hero.paragraphs.map((paragraph, i) => (

              <p key={i} className={i === 0 ? "text-base leading-relaxed text-cream-dim sm:text-lg" : "text-base leading-relaxed text-cream-dim sm:text-lg"}>

                {paragraph}

              </p>

            ))}
          </div>

          <Cta href="/#book" className="mt-10">
            {about.hero.ctaLabel}
          </Cta>
        </section>

        {/* The photo carries its own half of the gap on both sides, rather
            than the section below carrying a margin. Space owned by a block is
            space you can reason about; a margin between two blocks belongs to
            neither, and here it stacked on top of the next section's padding
            to make that one boundary twice the others. lg:pt-0 keeps the
            desktop hero and its image as tight as they are today. */}
        <div className="mx-auto max-w-7xl px-6 pt-8 pb-16 sm:pt-12 sm:pb-24 lg:px-10 lg:pt-0 lg:pb-32">
          <PhotoSlot
            src={about.hero.image?.src}
            alt={about.hero.image?.alt}
            objectPosition={about.hero.image?.objectPosition}
            label="Wide, warm shot of a finished Mason bathroom — the hero image for the page"
            className="h-[38vh] min-h-[280px] w-full sm:h-[52vh]"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        {/* ---- our story ----
            Sticky heading beside beats, each with its own chapter label. Five
            paragraphs in a single column is the most tiring block on the page;
            broken into labelled beats the reader gets landmarks and can rejoin
            the thread anywhere. */}
        <section className="border-t border-line bg-surface">
          <Reveal className="mx-auto max-w-7xl px-6 pt-16 pb-4 sm:pt-24 sm:pb-6 lg:px-10 lg:pt-32 lg:pb-8">
            <div className="grid gap-12 lg:grid-cols-[18rem_1fr] lg:gap-20">
              <div className="lg:sticky lg:top-32 lg:self-start">
                <p className="reveal eyebrow">{about.story.eyebrow}</p>
                <h2 className="reveal mt-5 h-display text-3xl text-cream sm:text-4xl">
                  <HighlightedText value={about.story.heading} />
                </h2>
              </div>

              <div className="max-w-2xl">
                {about.story.beats.map((beat, i) => (
                  <div key={`${i}-${beat.label}`}>
                    {/* not first:mt-0 — each beat is the first child of its own
                        wrapper, so the modifier would hit every one of them */}
                    <div
                      className={`reveal border-t border-line pt-6 ${
                        i === 0 ? "" : "mt-12"
                      }`}
                    >
                      <p className="eyebrow">{beat.label}</p>
                      <p className="mt-4 text-base leading-relaxed text-cream sm:text-lg">
                        {beat.body}
                      </p>
                    </div>

                    {/* one picture, placed at the turn in the story rather
                        than decoratively at the top */}
                    {i === 1 && (
                      <PhotoSlot
                        src={about.story.image?.src}
                        alt={about.story.image?.alt}
                        objectPosition={about.story.image?.objectPosition}
                        label="Tarang and Pranay together — candid, not a studio shot"
                        className="reveal mt-12 h-[30vh] min-h-[220px] w-full"
                        sizes="(max-width: 1024px) 100vw, 640px"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* The line the whole story lands on, given a page to itself. */}
        <section className="border-t border-line">
          <Reveal className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
            <p className="reveal h-display max-w-3xl text-3xl leading-[1.1] text-cream sm:text-4xl lg:text-5xl">
              <HighlightedText value={about.statement} />
            </p>
          </Reveal>
        </section>

        {/* ---- why we exist ----
            The one dark band on the page. It arrives after two paper sections,
            which is what makes it register as a change of voice. */}
        <section className="bg-forest-700">
          <Reveal className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
            <p className="reveal eyebrow on-dark mb-6">{about.why.eyebrow}</p>
            <h2 className="reveal h-display max-w-4xl text-3xl leading-[1.08] text-sand-100 sm:text-4xl lg:text-5xl">
              <HighlightedText value={about.why.heading} accentClassName="accent-word on-dark" />
            </h2>

            {/* three refusals, then the promise — the muted-to-bright turn does
                the work a paragraph break cannot */}
            <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
              <ul className="reveal space-y-4">
                {about.why.refusals.map((line) => (
                  <li key={line} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="mt-3 h-0.5 w-5 shrink-0 rounded-full bg-white/50"
                    />
                    {/* The refusals stay subordinate to the promise through
                        size and the forest rule beside it, not by being too
                        faint to read on the green. */}
                    <span className="text-base leading-relaxed text-sand-100/85 sm:text-lg">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="reveal border-l-2 border-forest-200 pl-6 text-lg leading-relaxed text-sand-100 sm:text-xl">
                {about.why.promise}
              </p>
            </div>

            <p className="reveal mt-16 max-w-3xl text-base leading-relaxed text-sand-100/75 sm:text-lg">
              {about.why.hope}
            </p>
          </Reveal>
        </section>

        {/* ---- why we are built for this ---- */}
        <section className="border-t border-line">
          <Reveal className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
            <div className="max-w-3xl">
              <p className="reveal eyebrow mb-6">{about.team.eyebrow}</p>
              <h2 className="reveal h-display text-3xl leading-[1.08] text-cream sm:text-4xl lg:text-5xl">
                <HighlightedText value={about.team.heading} />
              </h2>
              <p className="reveal mt-6 text-base leading-relaxed text-cream-dim sm:text-lg">
                {about.team.intro}
              </p>
            </div>

            {/* Desktop only. Pills are a horizontal device — they read as a
                row of tags when they sit side by side, and at 390px only two
                short ones fit on a line, so the set collapses into a ragged
                left-aligned column of five outlined lozenges of five different
                widths. Nothing about that says "tags" any more; it just looks
                like buttons that don't do anything. */}
            <ul className="reveal mt-10 hidden flex-wrap gap-2.5 sm:flex">
              {about.team.trust.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-line px-4 py-2 text-sm text-cream"
                >
                  {item}
                </li>
              ))}
            </ul>

            {/* Founders. Portrait beside the words, not above them — a name and
                a face carry the credibility here, so they lead the card. */}
            <div className="mt-16 grid gap-6 lg:grid-cols-2">
              {about.team.founders.map((f) => (
                <div
                  key={f.name}
                  className="reveal flex flex-col rounded-3xl bg-surface p-7 lg:p-9"
                >
                  <div className="flex items-center gap-5">
                    <PhotoSlot
                      src={f.photo?.src}
                      objectPosition={f.photo?.objectPosition}
                      label={`Portrait — ${f.name}`}
                      alt={f.name}
                      initials={initials(f.name)}
                      className="h-20 w-20 rounded-full text-lg sm:h-24 sm:w-24 sm:text-xl"
                      sizes="96px"
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold leading-tight text-cream sm:text-2xl">
                        {f.name}
                      </h3>
                      <p className="mt-1 text-sm text-sand-600">{f.role}</p>
                    </div>
                  </div>

                  {/* flex-1 on the bio, not mt-auto on the list: the credential
                      rules then sit level across both cards however the two
                      bios differ in length, without collapsing the gap above
                      them when a card happens to be full. */}
                  <p className="mt-7 flex-1 text-base leading-relaxed text-cream-dim">
                    {f.bio}
                  </p>

                  <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6">
                    {f.credentials.map((c) => (
                      <li
                        key={c}
                        className="font-mono-label text-[0.65rem] uppercase tracking-[0.18em] text-sand-400"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---- our approach ---- */}
        <section className="border-t border-line bg-surface">
          <Reveal className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
              <div>
                <p className="reveal eyebrow mb-6">{about.approach.eyebrow}</p>
                <h2 className="reveal h-display text-3xl leading-[1.06] text-cream sm:text-4xl lg:text-5xl">
                  <HighlightedText value={about.approach.heading} />
                </h2>
              </div>
              <div className="space-y-6">
                {about.approach.paragraphs.map((paragraph, i) => (

                  <p key={i} className={i === 0 ? "reveal text-base leading-relaxed text-cream sm:text-lg" : "reveal text-base leading-relaxed text-cream-dim sm:text-lg"}>

                    {paragraph}

                  </p>

                ))}
              </div>
            </div>

            {/* Photo beside the list, not a grid of ten cells and a photo band
                stacked under it. A cell wide enough for "Night-time use" is far
                too wide for "Sitting", so a grid spent most of its area on
                nothing; here the spare width goes to the picture, which can use
                it, and the ten moments stay a tight scannable column. */}
            <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
              <PhotoSlot
                src={about.approach.image?.src}
                alt={about.approach.image?.alt}
                objectPosition={about.approach.image?.objectPosition}
                label="Installer at work — hands, a grab bar going in, close and unstaged"
                className="reveal h-[38vh] min-h-[280px] w-full lg:h-auto"
                sizes="(max-width: 1024px) 100vw, 620px"
              />

              <div>
                <p className="reveal eyebrow">
                  {about.approach.routineLabel}
                </p>
                {/* rows-5 + flow-col so the numbering runs down the first
                    column and continues down the second, rather than
                    zig-zagging across the pair */}
                <ul className="reveal mt-5 grid gap-x-12 sm:grid-flow-col sm:grid-rows-5">
                  {about.approach.routine.map((moment, i) => (
                    <li
                      key={moment}
                      className="flex items-center gap-4 border-b border-line py-3.5"
                    >
                      <span className="font-mono-label text-[0.65rem] text-sand-400">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-display text-base font-semibold leading-snug text-cream">
                        {moment}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---- what we want to achieve ---- */}
        <section className="border-t border-line">
          <Reveal className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-10 lg:py-32">
            <p className="reveal eyebrow mb-6">{about.goals.eyebrow}</p>
            <h2 className="reveal h-display max-w-4xl text-3xl leading-[1.08] text-cream sm:text-4xl">
              <HighlightedText value={about.goals.heading} />
            </h2>
            <p className="reveal mt-8 max-w-2xl text-base leading-relaxed text-cream-dim sm:text-lg">
              {about.goals.intro}
            </p>

            {/* Three cells in a row from sm, a divided list below it. The
                grid draws its cards by showing a bg-line container through
                1px gaps — which works across three columns, but stacked into
                one it produces cards you cannot see: the fill is the page
                colour, so all that survives is a hairline and a 28px inset.
                That inset pushed this copy off the left edge every other
                block on the page sits on, and the last cell's 28px of bottom
                padding read as section spacing, making this boundary 156px
                where every other one is 128.

                So below sm the padding goes horizontal-zero, the rules become
                real borders, and the first and last cells drop their outer
                padding — the same divided-list rhythm used further up the
                page. One class per property rather than a base plus an
                override, because two utilities for the same property resolve
                by stylesheet order, not by the order written here. */}
            <div className="reveal mt-14 grid gap-px overflow-hidden rounded-2xl bg-line max-sm:mt-10 max-sm:gap-0 max-sm:rounded-none max-sm:bg-transparent sm:grid-cols-3">
              {about.goals.items.map((g, i) => (
                <div
                  key={`${i}-${g.label}`}
                  className={`bg-ink p-7 max-sm:bg-transparent max-sm:px-0 lg:p-9 ${
                    i === 0
                      ? "max-sm:pt-0"
                      : "max-sm:border-t max-sm:border-line max-sm:pt-6"
                  } ${i === about.goals.items.length - 1 ? "max-sm:pb-0" : "max-sm:pb-6"}`}
                >
                  <p className="eyebrow">{g.label}</p>
                  <p className="mt-4 text-base leading-relaxed text-cream">
                    {g.body}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ---- closing ----
            Green, like the closing CTA on the homepage, rather than an image
            behind an overlay: an unfilled PhotoSlot under 85% green would be
            invisible, which defeats the point of a placeholder announcing
            itself. The photo band sits above it instead. */}
        <div className="mx-auto max-w-7xl px-6 pt-4 pb-16 sm:pt-6 sm:pb-24 lg:px-10 lg:pt-8 lg:pb-32">
          <PhotoSlot
            src={about.closing.image?.src}
            alt={about.closing.image?.alt}
            objectPosition={about.closing.image?.objectPosition}
            label="Quiet, well-lit bathroom at night — the closing image"
            className="h-[34vh] min-h-[240px] w-full"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        <section className="bg-forest-700">
          <Reveal className="mx-auto max-w-7xl px-6 py-16 text-center sm:py-24 lg:px-10 lg:py-32">
            <h2 className="reveal mx-auto h-display max-w-3xl text-3xl leading-[1.08] text-sand-100 sm:text-4xl lg:text-5xl">
              <HighlightedText value={about.closing.heading} accentClassName="accent-word on-dark" />
            </h2>
            <p className="reveal mx-auto mt-6 max-w-xl text-base leading-relaxed text-sand-100/80 sm:text-lg">
              {about.closing.body}
            </p>
            <div className="reveal mt-10">
              <Cta href="/#book" variant="light">
                {about.closing.ctaLabel}
              </Cta>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
