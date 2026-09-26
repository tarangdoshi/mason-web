"use client";

import Link from "next/link";
import { getPackageCodeFromName } from "../lib/crm-contract";
import { storeLeadCtaContext } from "../lib/lead-context";
import { parsePackagePrice, trackAnalyticsEvent } from "../lib/analytics";
import { ArrowForward } from "./Icon";
import { useBooking } from "./BookingDialog";

/* The one CTA on the site. Every call-to-action goes through this so heights,
   type size and the hover-slide arrow can't drift apart again.

   Sizes are contextual, not decorative:
     default — section-level CTAs
     compact — the nav, which lives in a fixed-height bar
     block   — inside a card, where the button spans the column

   Variants ending in "Light" sit on the dark green / near-black surfaces. */

type Variant = "solid" | "outline" | "light" | "outlineLight";
type Size = "default" | "compact" | "block";

const VARIANTS: Record<Variant, string> = {
  solid: "bg-accent text-on-accent hover:bg-accent-hover",
  outline: "border border-line text-cream hover:border-line-strong",
  light: "bg-sand-100 text-cream hover:bg-white",
  outlineLight: "border border-white/35 text-white hover:border-white/70",
};

const SIZES: Record<Size, string> = {
  default: "px-8 py-4 text-base",
  compact: "px-6 py-3 text-sm",
  block: "w-full justify-center px-4 py-3 text-sm sm:text-base",
};

/* Not transition-all: this element may sit inside a GSAP timeline, and
   transitioning every property fights whatever GSAP writes each frame.
   Tailwind's translate utilities use the `translate` property, which is
   separate from the `transform` GSAP animates, so the lift is safe. */
const BASE =
  "group inline-flex items-center gap-2.5 rounded-full font-semibold transition-[background-color,border-color,color,translate] duration-150 hover:-translate-y-0.5";

/** Exported so non-link CTAs (the booking form's submit) match exactly. */
export function ctaClass({
  variant = "solid",
  size = "default",
  className = "",
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
}

/** Every "book" CTA opens the form rather than jumping to the section. */
const BOOKING_HREFS = new Set(["#book", "/#book"]);

export default function Cta({
  href,
  packageName,
  packagePrice,
  children,
  variant = "solid",
  size = "default",
  arrow = true,
  className = "",
}: {
  href: string;
  packageName?: string;
  /** Current selling price, e.g. "₹29,999"; reported with select_package. */
  packagePrice?: string;
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  /** Off only where the arrow would read as decoration rather than direction. */
  arrow?: boolean;
  className?: string;
}) {
  const booking = useBooking();
  const classes = ctaClass({ variant, size, className });

  const label = (
    <>
      {children}
      {arrow && (
        <ArrowForward
          size={size === "default" ? 19 : 17}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      )}
    </>
  );

  // Falls back to a plain link when no provider is mounted, so the CTA still
  // does something sensible rather than breaking.
  if (booking && BOOKING_HREFS.has(href)) {
    return (
      <button type="button" onClick={(event) => {
        const section = event.currentTarget.closest("section")?.id || "navigation";
        storeLeadCtaContext({entryPoint:"assessment-form", ctaId:"book-free-safety-assessment", pageSection:section, packageName, packageCode:packageName ? getPackageCodeFromName(packageName) || undefined : undefined});
        trackAnalyticsEvent("homepage_cta_click", {cta_location:"public-cta",section});
        if (packageName) {
          trackAnalyticsEvent("package_cta_click", {package:packageName,cta_location:"public-package",section});
          trackAnalyticsEvent("select_package", {package_name:packageName,package_price:parsePackagePrice(packagePrice)});
        }
        booking.open(packageName);
      }} className={classes}>
        {label}
      </button>
    );
  }

  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  );
}
