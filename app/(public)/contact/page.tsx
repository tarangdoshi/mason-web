import type { Metadata } from "next";
import Image from "next/image";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import HighlightedText from "@/components/HighlightedText";
import { getPublicSiteContent } from "@/lib/cms/load";
import { cmsMetadata } from "@/lib/cms/seo";

/* Content comes from Sanity (Contact & Support); published changes appear within a minute. */
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("contact", {
    alternates: {canonical: "https://www.masoncompany.in/contact"},
    title: "Contact - Mason Company",
    description:
      "Talk to Mason Company about making a bathroom safer for ageing parents. Call, WhatsApp, or send an enquiry - we reply within 24 hours.",
  });
}

export default async function ContactPage() {
  const { contactPage: page, settings } = await getPublicSiteContent();
  const { contact } = settings;
  const DETAILS: { title: string; lines: { text: string; href?: string }[] }[] = [
    { title: page.callLabel, lines: [{ text: contact.phoneDisplay, href: contact.phoneHref }] },
    { title: page.hoursLabel, lines: [{ text: contact.supportHours }] },
    { title: page.emailLabel, lines: [{ text: contact.supportEmail, href: `mailto:${contact.supportEmail}` }] }
  ];
  return (
    <>
      <Nav />
      <main>
        {/* Page header — headline left, the promise right, as in the reference */}
        <section className="mx-auto max-w-7xl px-6 pt-32 pb-10 lg:px-10 lg:pt-40 lg:pb-14">
          <p className="eyebrow mb-5">{page.eyebrow}</p>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            <h1 className="h-display max-w-2xl text-5xl text-cream sm:text-6xl lg:text-7xl">
              <HighlightedText value={page.heading} />
            </h1>
            <p className="max-w-sm text-base leading-relaxed text-cream-dim lg:pb-3 lg:text-right">
              {page.intro}
            </p>
          </div>
        </section>

        {/* Form + photograph */}
        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-10 lg:pb-24">
          <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <ContactForm />

            {/* The reference floats a pill on the image; the site's own
                pattern is a dark scrim with the caption sitting ON the
                photograph, so it uses that instead. */}
            <div className="relative min-h-[340px] overflow-hidden rounded-3xl border border-line sm:min-h-[420px] lg:min-h-0">
              <Image
                src={page.image.src}
                alt={page.image.alt}
                fill
                sizes="(min-width: 1024px) 34vw, 100vw"
                className="object-cover"
              />
              <div className="photo-scrim absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-7 sm:p-8">
                <p className="eyebrow on-dark">{page.cardTitle}</p>
                <p className="mt-3 font-display text-xl font-extrabold leading-snug text-white sm:text-2xl">
                  {page.cardBody}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact details — three columns split by hairlines rather than the
            reference's icon-in-a-circle tiles. */}
        {/* No background of its own - it stays on the page's paper, so the
            hairline is the only thing marking the section and the footer's
            hard dark edge arrives after one continuous stretch rather than a
            second grey slab.
            Spacing follows from that: the rule needs at least as much air
            below it as the form section leaves above (pb-20/24), and the
            bottom needs more again to clear the footer. */}
        <Reveal
          as="section"
          className="border-t border-line pt-20 pb-24 lg:pt-24 lg:pb-32"
        >
          {/* px INSIDE max-w-7xl, matching the two sections above. With the
              padding on the section instead, the max-width box centres inside
              an already-inset area and the columns end up 24px left of the
              headline on anything wider than 1280px. */}
          <div className="mx-auto grid max-w-7xl gap-10 px-6 sm:grid-cols-3 sm:gap-0 lg:px-10">
            {DETAILS.map((d, i) => (
              <div
                key={d.title}
                className={`reveal ${
                  i === 0 ? "sm:pr-8" : "sm:border-l sm:border-line sm:px-8"
                } ${i === DETAILS.length - 1 ? "sm:pr-0" : ""}`}
              >
                <p className="eyebrow">{d.title}</p>
                <div className="mt-4 space-y-1.5">
                  {d.lines.map((line) =>
                    line.href ? (
                      <a
                        key={line.text}
                        href={line.href}
                        className="block text-lg font-semibold text-cream transition-colors duration-150 hover:text-accent"
                      >
                        {line.text}
                      </a>
                    ) : (
                      <p
                        key={line.text}
                        className="text-lg font-semibold text-cream"
                      >
                        {line.text}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
