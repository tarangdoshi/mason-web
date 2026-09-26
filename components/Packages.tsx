import Reveal from "./Reveal";
import { serverEditProps } from "@/lib/cms/edit-server";
import { DOCS } from "@/lib/cms/edit";
import PackageCard from "./PackageCard";
import HighlightedText from "./HighlightedText";
import type { HomeContent, PackagesContent } from "@/lib/cms/model";

export default async function Packages({ content, packages }: { content: HomeContent["packages"]; packages: PackagesContent }) {
  const edit = await serverEditProps({ ...DOCS.homepage, path: "packagesSection" });
  const planEdits = await Promise.all(packages.plans.map((plan) => serverEditProps(DOCS.package(plan.code))));
  return (
    <section
      id="packages"
      {...edit}
      /* min-h, not h: a hard height plus overflow-hidden clipped the bottom of
         the cards once the rows and outcome copy went in. */
      className="relative bg-forest-700 py-14 sm:py-20 lg:min-h-screen lg:py-0"
    >
      <Reveal className="mx-auto flex h-full max-w-7xl flex-col px-6 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="reveal eyebrow on-dark mb-3">
            {content.eyebrow}
          </p>
          <h2 className="reveal h-display text-3xl text-sand-100 sm:text-4xl lg:text-[2.5rem]">
            <HighlightedText value={content.heading} accentClassName="accent-word on-dark" />
          </h2>
          <p className="reveal mt-3 text-base leading-relaxed text-sand-100/75">
            {content.subtitle}
          </p>
        </div>

        {/* Equal columns — the cards are the same object as on /packages
            now, and the old 1.12fr lean only widened the featured one. */}
        {/* Stacked below lg, the featured card is pulled to the top. Source
            order is Standard then Advanced because side by side that reads
            left-to-right as base then upgrade — but in a single column the
            first card is simply the one you see, and burying the recommended
            package under a full card's scroll is the wrong way round. Order
            only, not the data: /packages renders the same two cards from the
            same array. */}
        <div className="mt-8 grid gap-6 lg:mt-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto_auto_auto_1fr] lg:gap-y-0">
          {packages.plans.map((plan, index) => (
            <PackageCard
              key={plan.code}
              plan={plan}
              editAttributes={planEdits[index]}
              rows={packages.rows}
              popularLabel={packages.popularLabel}
              ctaLabel={packages.homeCardCta}
              tone="green"
              className={`reveal ${plan.isPopular ? "order-first lg:order-none" : ""}`}
            />
          ))}
        </div>

        <p className="reveal mt-5 text-xs leading-relaxed text-sand-100/60 lg:hidden">
          {content.footnote}
        </p>
      </Reveal>
    </section>
  );
}
