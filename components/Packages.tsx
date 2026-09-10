import Reveal from "./Reveal";
import PackageCard from "./PackageCard";
import { PACKAGES } from "./packages-data";

export default function Packages() {
  return (
    <section
      id="packages"
      /* min-h, not h: a hard height plus overflow-hidden clipped the bottom of
         the cards once the rows and outcome copy went in. */
      className="relative bg-forest-700 py-14 sm:py-20 lg:min-h-screen lg:py-0"
    >
      <Reveal className="mx-auto flex h-full max-w-7xl flex-col px-6 lg:px-10 lg:py-24">
        <div className="max-w-2xl">
          <p className="reveal eyebrow on-dark mb-3">
            Choose your safety package
          </p>
          <h2 className="reveal h-display text-3xl text-sand-100 sm:text-4xl lg:text-[2.5rem]">
            The same complete kit. You choose the{" "}
            <span className="accent-word on-dark">cover</span>.
          </h2>
          <p className="reveal mt-3 text-base leading-relaxed text-sand-100/75">
            Both packages install everything, fitted by Mason-trained experts.
            Advanced simply keeps looking after it for a year.
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
        <div className="mt-8 grid gap-6 lg:mt-6 lg:min-h-0 lg:flex-1 lg:grid-cols-2">
          {PACKAGES.map((p) => (
            <PackageCard
              key={p.name}
              pkg={p}
              tone="green"
              className={`reveal ${p.popular ? "order-first lg:order-none" : ""}`}
            />
          ))}
        </div>

        <p className="reveal mt-5 text-xs leading-relaxed text-sand-100/60 lg:hidden">
          Both packages are planned for real bathroom movement and installed by
          trained Mason experts - so the result feels safe, thoughtful, and
          still beautifully at home.
        </p>
      </Reveal>
    </section>
  );
}
