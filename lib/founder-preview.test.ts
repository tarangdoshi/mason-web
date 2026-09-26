import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const { JSDOM } = require("jsdom");
import { homepageContent } from "../content/homepage.content";
import { fallbackPackages, fallbackHome } from "./cms/fallback";
import { resolvePublicSite } from "./cms/resolve";
import LeadPrivacyNotice from "../app/components/lead-privacy-notice";

Object.defineProperty(globalThis, "React", { value: React, configurable: true });
const previousCssLoader = require.extensions[".css"];
require.extensions[".css"] = (module: { exports: unknown }) => { module.exports = {}; };
const PackageCard = require("../components/PackageCard.tsx").default as typeof import("../components/PackageCard").default;
const Footer = require("../components/Footer.tsx").default as typeof import("../components/Footer").default;
const Cta = require("../components/Cta.tsx").default as typeof import("../components/Cta").default;
if (previousCssLoader) require.extensions[".css"] = previousCssLoader;
else delete require.extensions[".css"];

const cardProps = (plan: (typeof fallbackPackages.plans)[number], home: boolean) => ({
  plan, rows: fallbackPackages.rows.map((row) => ({ ...row, label: row.label.replace("{count}", String(fallbackPackages.components.length)) })),
  popularLabel: fallbackPackages.popularLabel, ctaLabel: home ? fallbackPackages.homeCardCta : fallbackPackages.pageCardCta, tone: home ? "green" as const : "paper" as const
});

test("package cards use context-specific CTA copy and retain each package destination", () => {
  for (const plan of fallbackPackages.plans) {
    const home = new JSDOM(renderToStaticMarkup(React.createElement(PackageCard, cardProps(plan, true))));
    const dedicated = new JSDOM(renderToStaticMarkup(React.createElement(PackageCard, cardProps(plan, false))));
    assert.equal(home.window.document.querySelector(`a[href="/packages/${plan.slug}"]`)?.textContent?.trim(), "View Details");
    assert.equal(dedicated.window.document.querySelector('a[href="#book"]')?.textContent?.trim(), "Book Free Inspection");
    assert.ok((home.window.document.body.textContent || "").includes(plan.price));
    home.window.close();
    dedicated.window.close();
  }
});

test("both packages include one Raised Toilet Seat among 13 component categories", () => {
  const { packages } = resolvePublicSite(null);
  for (const plan of packages.plans) {
    assert.equal(plan.componentIds.length, 13);
    const raisedSeat = packages.components.find((component) => component.id === "raised-toilet-seat");
    assert.equal(raisedSeat?.title, "Raised Toilet Seat");
    assert.equal(raisedSeat?.quantity, 1);
  }
});

test("founder copy and testimonial names are exact in the fallback content", () => {
  assert.equal(fallbackHome.hero.heading.text, "Most falls happen in the bathroom. We make sure yours don't.");
  assert.equal(fallbackHome.faq.items.find((item) => item.question === "Do you renovate the entire bathroom?")?.answer,
    "No. Mason focuses on safety upgrades to the existing bathroom. Our installations do not require any renovation.");
  assert.deepEqual(fallbackHome.testimonials.items.map((item) => item.name), ["Maria Pereira", "Rohan Naik", "Neha Shah", "Karl Fernandes"]);
  assert.deepEqual(fallbackHome.testimonials.items.map((item) => item.city), ["Goa", "Goa", "Goa", "Goa"]);
});

test("published CMS values win over code fallbacks (no founder locks)", () => {
  const site = resolvePublicSite({
    homepage: { hero: { heading: "New Founder Hero", headingHighlights: ["Founder"], primaryCta: "Start here" }, processSection: { primaryCta: "Get started" } },
    faqs: { items: [{ question: "Do you renovate the entire bathroom?", answer: "Edited answer" }] },
    testimonials: [{ name: "New Customer", relation: "Son", city: "Panaji", quote: "Edited quote" }]
  });
  assert.deepEqual(site.home.hero.heading, { text: "New Founder Hero", highlights: ["Founder"] });
  assert.equal(site.home.hero.primaryCta, "Start here");
  assert.equal(site.home.process.ctaLabel, "Get started");
  assert.deepEqual(site.home.faq.items, [{ question: "Do you renovate the entire bathroom?", answer: "Edited answer" }]);
  assert.deepEqual(site.home.testimonials.items, [{ name: "New Customer", relation: "Son", city: "Panaji", quote: "Edited quote" }]);
});

test("form notice is the exact 8px legal sentence with only the policy names linked", () => {
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(LeadPrivacyNotice)));
  const notice = dom.window.document.querySelector("p");
  assert.equal(notice?.textContent, "By submitting, you agree to our Privacy Policy and Terms.");
  assert.equal(notice?.style.fontSize, "0.5rem");
  const links = Array.from((notice?.querySelectorAll("a") || []) as ArrayLike<HTMLAnchorElement>, (link) => [link.textContent, link.getAttribute("href")]);
  assert.deepEqual(links, [["Privacy Policy", "/privacy"], ["Terms", "/terms"]]);
  dom.window.close();
});

test("footer navigation keeps Terms and omits the standalone refund link", () => {
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(Footer)));
  const hrefs = Array.from(dom.window.document.querySelectorAll("footer a") as NodeListOf<HTMLAnchorElement>, (link) => link.getAttribute("href"));
  assert.ok(hrefs.includes("/terms"));
  assert.equal(hrefs.includes("/refund"), false);
  assert.doesNotMatch(dom.window.document.querySelector("footer")?.textContent || "", /Refund & Cancellations|Refund & Cancellation Policy/);
  dom.window.close();
});

test("active customer-facing booking surfaces never say Safety Visit", () => {
  const surfaces = [
    "../components/BookingDialog.tsx", "../components/Booking.tsx", "../components/Hero.tsx", "../components/Nav.tsx",
    "../components/Process.tsx", "../components/PackageCard.tsx", "../app/(public)/packages/page.tsx",
    "../app/(public)/about/page.tsx", "../app/(public)/contact/page.tsx", "../app/(marketing)/packages/[slug]/page.tsx",
    "../app/(marketing)/compare-packages/compare-packages-view.tsx", "../app/(marketing)/checkout/[packageId]/page.tsx",
    "../app/(marketing)/checkout/components/checkout-experience.tsx"
  ];
  for (const surface of surfaces) {
    const source = readFileSync(new URL(surface, import.meta.url), "utf8");
    // Headings split the phrase across an accent span, so match through markup.
    // "annual safety visits" is the approved Advanced AMC wording, not the retired CTA.
    assert.doesNotMatch(source, /(?<!annual )safety(\s|<[^>]*>|\{" "\})+(visit|assessment)/i, surface);
  }
});

test("homepage View Details reports select_package with the current selling price", () => {
  const findCta = (node: unknown): React.ReactElement<Record<string, unknown>> | null => {
    if (!node || typeof node !== "object") return null;
    if (Array.isArray(node)) return node.map(findCta).find(Boolean) || null;
    const element = node as React.ReactElement<{ children?: unknown }>;
    if (element.type === Cta) return element as React.ReactElement<Record<string, unknown>>;
    return findCta(element.props?.children);
  };
  const gtagCalls: unknown[][] = [];
  const storage = new Map<string, string>();
  const previousGa = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST123";
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    location: { href: "https://www.masoncompany.in/", origin: "https://www.masoncompany.in", pathname: "/", search: "" },
    sessionStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => void storage.set(key, value), removeItem: (key: string) => void storage.delete(key) },
    crypto: { randomUUID: () => "test-session" },
    gtag: (...args: unknown[]) => void gtagCalls.push(args)
  } });
  Object.defineProperty(globalThis, "document", { configurable: true, value: { referrer: "", title: "Mason Company" } });
  try {
    for (const [name, expectedPrice] of [["Standard", 29999], ["Advanced", 36999]] as const) {
      const plan = fallbackPackages.plans.find((item) => item.name === name)!;
      const cta = findCta(PackageCard(cardProps(plan, true)));
      assert.equal(cta?.props.href, `/packages/${name.toLowerCase()}`);
      // Render the real Cta so its hooks run, then fire the link's own click handler.
      let link: React.ReactElement<{ onClick?: (event: unknown) => void }> | null = null;
      const Probe = () => { link = Cta(cta!.props as Parameters<typeof Cta>[0]) as typeof link; return null; };
      renderToStaticMarkup(React.createElement(Probe));
      gtagCalls.length = 0;
      link!.props.onClick?.({ currentTarget: { closest: () => ({ id: "packages" }) } });
      const selected = gtagCalls.filter((call) => call[0] === "event" && call[1] === "select_package").map((call) => call[2] as Record<string, unknown>);
      assert.deepEqual(selected.map((event) => [event.package_name, event.package_price]), [[name, expectedPrice]]);
    }
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
    if (previousGa === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = previousGa;
  }
});

const AMC_SHORT = "2-Year Safety AMC Included";
const AMC_DETAIL = "Includes annual safety visits for 2 years after installation. We inspect the installed safety setup and fix, change or replace items where required.";

test("Advanced is described as a 2-Year Safety AMC with annual visits, everywhere it is shown", () => {
  const advancedCard = fallbackPackages.plans.find((plan) => plan.name === "Advanced")!;
  assert.equal(advancedCard.badge, AMC_SHORT);
  assert.equal(advancedCard.bestFor, AMC_DETAIL);
  assert.deepEqual(fallbackPackages.rows.filter((row) => row.advanced && !row.standard).map((row) => row.label), [AMC_SHORT]);
  const advancedPlan = homepageContent.packagesSection.plans.find((plan) => plan.name === "Advanced")!;
  assert.equal(advancedPlan.badge, AMC_SHORT);
  assert.equal(advancedPlan.bestFor, AMC_DETAIL);
  assert.ok(advancedPlan.visualHighlights?.includes("2-Year Safety AMC"));
  const advancedFaq = homepageContent.faqSection.items.find((item) => item.question === "What is included in Advanced?")!.answer;
  assert.match(advancedFaq, /annual safety visits for 2 years after installation/);
  assert.match(advancedFaq, /fix, change or replace items where required/);
  assert.match(homepageContent.packagesSection.subtitle || "", /annual safety visits for 2 years after installation/);

  // Wording that implies a single visit, a mere check-up, or the retired first-year cover.
  const retired = /check-?up|first year|1-year|one (safety |follow-up )?visit (in|within|during|after)|only one visit|two years on|two years of cover/i;
  for (const source of [
    "../lib/cms/fallback.ts", "../components/FAQ.tsx", "../components/Packages.tsx", "../content/homepage.content.ts",
    "../content/compare-packages.content.ts", "../app/(marketing)/compare-packages/compare-packages-view.tsx",
    "../app/(marketing)/compare-packages/page.tsx", "../app/(marketing)/checkout/components/checkout-experience.tsx",
    "../app/(marketing)/packages/[slug]/page.tsx", "../app/(public)/packages/page.tsx"
  ]) {
    assert.doesNotMatch(readFileSync(new URL(source, import.meta.url), "utf8"), retired, source);
  }
});

test("Packages page heading highlights Free, not inspection", () => {
  const { packagesPage } = resolvePublicSite(null);
  assert.deepEqual(packagesPage.heading, { text: "Book a free bathroom inspection.", highlights: ["free"] });
  const source = readFileSync(new URL("../app/(public)/packages/page.tsx", import.meta.url), "utf8");
  assert.match(source, /<HighlightedText value=\{page\.heading\} \/>/);
});

test("customer phone fields show Mason's number only as an empty-field example", () => {
  for (const surface of ["../app/components/phone-field.tsx", "../components/ContactForm.tsx"]) {
    const source = readFileSync(new URL(surface, import.meta.url), "utf8");
    assert.match(source, /placeholder="81494 33383"/, surface);
    assert.doesNotMatch(source, /99718\s?91017|98765 43210/, surface);
    assert.doesNotMatch(source, /(defaultValue|value)=["{]\s*"?(\+91)?\s*81494/, surface);
    assert.match(source, /required/, surface);
  }
});

test("Raised Toilet Seat shows a quantity of 1 and other quantities are unchanged", () => {
  assert.deepEqual(fallbackPackages.components.map((item) => [item.id, item.quantity]), [
    ["vertical-grab-bars", 3], ["angled-grab-bar", 1], ["folding-bar", 1], ["anti-slip-coating", 1],
    ["anti-slip-mat-shower", 1], ["anti-slip-mat-post-shower", 1], ["shower-stool", 1], ["two-way-lock", 1],
    ["corner-safety", 1], ["drainage-solution", 4], ["slippers-one", 1], ["total-support-solution", 1],
    ["raised-toilet-seat", 1]
  ]);
  // The Packages page falls back to "Included" only for a component without a
  // quantity, so every canonical component must carry one.
  assert.ok(fallbackPackages.components.every((component) => typeof component.quantity === "number"));
});

test("old form legal copy is gone from every customer form", () => {
  for (const surface of ["../app/components/lead-privacy-notice.tsx", "../app/components/assessment-lead-form.tsx", "../components/ContactForm.tsx",
    "../components/BookingDialog.tsx", "../app/(marketing)/checkout/components/checkout-experience.tsx"]) {
    assert.doesNotMatch(readFileSync(new URL(surface, import.meta.url), "utf8"), /T&(amp;)?C apply/, surface);
  }
});

test("customer support email and hours are the founder-approved values everywhere they are published", () => {
  const details = require("../components/contact-details.ts") as typeof import("../components/contact-details");
  assert.equal(details.CARE_EMAIL, "support@masoncompany.in");
  assert.equal(details.HOURS, "Monday to Friday, 10 am to 7 pm");

  const footer = new JSDOM(renderToStaticMarkup(React.createElement(Footer)));
  const mailtos = Array.from(footer.window.document.querySelectorAll('a[href^="mailto:"]') as NodeListOf<HTMLAnchorElement>, (link) => link.getAttribute("href"));
  assert.deepEqual(mailtos, ["mailto:support@masoncompany.in"]);
  footer.window.close();

  const { PRIVACY, TERMS, REFUND } = require("../components/legal-data.ts") as typeof import("../components/legal-data");
  for (const doc of [PRIVACY, TERMS, REFUND]) {
    const text = JSON.stringify(doc);
    assert.match(text, /mailto:support@masoncompany\.in/);
  }

  const stale = /care@masoncompany\.in|Mon\s*-\s*Sat|9\s?am|saturday|sunday|weekend|24\s*\/\s*7|24x7/i;
  for (const surface of ["../components/contact-details.ts", "../components/legal-data.ts", "../components/Footer.tsx",
    "../app/(public)/contact/page.tsx", "../components/FAQ.tsx", "../content/homepage.content.ts", "../lib/cms/fallback.ts"]) {
    assert.doesNotMatch(readFileSync(new URL(surface, import.meta.url), "utf8"), stale, surface);
  }
});

test("public wrapper clips horizontal overflow without breaking position: sticky", () => {
  // public.css is scoped onto the .mason-public wrapper, so its body rule styles
  // that div. overflow-x: hidden alone would make it a non-scrolling scroll
  // container and disable the FAQ and About sticky columns.
  const css = readFileSync(new URL("../app/(public)/public.css", import.meta.url), "utf8");
  const bodyRule = css.match(/\nbody\s*\{([^}]*)\}/)![1];
  const overflowX = Array.from(bodyRule.matchAll(/overflow-x:\s*([a-z]+)/g), (match) => match[1]);
  assert.equal(overflowX.at(-1), "clip");
  assert.doesNotMatch(bodyRule, /(^|[^-])overflow:\s*(hidden|auto|scroll)/);
  const postcss = readFileSync(new URL("../postcss.config.mjs", import.meta.url), "utf8");
  assert.match(postcss, /selector === "body"\) return prefix/);
  const faq = readFileSync(new URL("../components/FAQ.tsx", import.meta.url), "utf8");
  assert.match(faq, /lg:sticky lg:top-28 lg:self-start/);
});
