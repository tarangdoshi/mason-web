import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const { JSDOM } = require("jsdom");
import { homepageContent } from "../content/homepage.content";
import { getPackageCatalogEntry, getIncludedFeatures } from "../content/package-catalog";
import { packageCardFromPlan } from "../components/packages-data";
import LeadPrivacyNotice from "../app/components/lead-privacy-notice";

Object.defineProperty(globalThis, "React", { value: React, configurable: true });
const previousCssLoader = require.extensions[".css"];
require.extensions[".css"] = (module: { exports: unknown }) => { module.exports = {}; };
const PackageCard = require("../components/PackageCard.tsx").default as typeof import("../components/PackageCard").default;
const Footer = require("../components/Footer.tsx").default as typeof import("../components/Footer").default;
const Cta = require("../components/Cta.tsx").default as typeof import("../components/Cta").default;
if (previousCssLoader) require.extensions[".css"] = previousCssLoader;
else delete require.extensions[".css"];

test("package cards use context-specific CTA copy and retain each package destination", () => {
  for (const plan of homepageContent.packagesSection.plans) {
    const pkg = packageCardFromPlan(plan, 0);
    const slug = plan.name.toLowerCase();
    const home = new JSDOM(renderToStaticMarkup(React.createElement(PackageCard, { pkg, tone: "green" })));
    const dedicated = new JSDOM(renderToStaticMarkup(React.createElement(PackageCard, { pkg, tone: "paper" })));
    assert.equal(home.window.document.querySelector(`a[href="/packages/${slug}"]`)?.textContent?.trim(), "View Details");
    assert.equal(dedicated.window.document.querySelector('a[href="#book"]')?.textContent?.trim(), "Book Free Inspection");
    assert.ok((home.window.document.body.textContent || "").includes(plan.currentPrice!));
    home.window.close();
    dedicated.window.close();
  }
});

test("both packages include one Raised Toilet Seat among 13 component categories", () => {
  for (const plan of homepageContent.packagesSection.plans) {
    const entry = getPackageCatalogEntry(plan.id);
    assert.ok(entry);
    assert.equal(getIncludedFeatures(entry).length, 13);
    const raisedSeat = getIncludedFeatures(entry).find((feature) => feature.id === "raised-toilet-seat");
    assert.equal(raisedSeat?.label, "Raised Toilet Seat");
    assert.equal(raisedSeat?.quantity, 1);
  }
});

test("founder copy and testimonial names are exact", () => {
  assert.equal(homepageContent.hero.heading, "Most falls happen in the bathroom. We make sure yours don't.");
  assert.equal(homepageContent.faqSection.items.find((item) => item.question === "Do you renovate the entire bathroom?")?.answer,
    "No. Mason focuses on safety upgrades to the existing bathroom. Our installations do not require any renovation.");
  assert.deepEqual(homepageContent.testimonialsSection.items.slice(0, 4).map((item) => item.author),
    ["Maria Pereira", "Rohan Naik", "Neha Shah", "Karl Fernandes"]);
});

test("older CMS copy cannot override founder-approved hero, FAQ or testimonial names", async () => {
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||= "testproject";
  const { applySanityHomepage, applyFounderTestimonialNames } = await import("./site-content");
  const withOldCms = applySanityHomepage(homepageContent, {
    hero: { heading: "Previous title", primaryCta: "Previous CTA" },
    processSection: { ...homepageContent.processSection, primaryCta: "Book a Safety Visit" },
    faqSection: {
      ...homepageContent.faqSection,
      items: homepageContent.faqSection.items.map((item) => item.question === "Do you renovate the entire bathroom?"
        ? { ...item, answer: "Previous answer" } : item)
    },
    testimonialsSection: {
      ...homepageContent.testimonialsSection,
      items: homepageContent.testimonialsSection.items.map((item, index) => ({ ...item, author: `Old name ${index + 1}`, city: "Delhi" }))
    }
  }, null);
  const approved = applyFounderTestimonialNames(withOldCms);
  assert.equal(approved.hero.heading, homepageContent.hero.heading);
  assert.equal(approved.hero.primaryCta, "Book Free Inspection");
  assert.equal(approved.processSection.primaryCta, "Book Free Inspection");
  assert.equal(approved.faqSection.items.find((item) => item.question === "Do you renovate the entire bathroom?")?.answer,
    homepageContent.faqSection.items.find((item) => item.question === "Do you renovate the entire bathroom?")?.answer);
  assert.deepEqual(approved.testimonialsSection.items.slice(0, 4).map((item) => item.author),
    ["Maria Pereira", "Rohan Naik", "Old name 3", "Karl Fernandes"]);
  assert.deepEqual(approved.testimonialsSection.items.map((item) => item.city), approved.testimonialsSection.items.map(() => "Goa"));
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
      const plan = homepageContent.packagesSection.plans.find((item) => item.name === name)!;
      const cta = findCta(PackageCard({ pkg: packageCardFromPlan(plan, 0), tone: "green" }));
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
  const { PACKAGES, PACKAGE_ROWS } = require("../components/packages-data.ts") as typeof import("../components/packages-data");
  const advancedCard = PACKAGES.find((pkg) => pkg.name === "Advanced")!;
  assert.equal(advancedCard.badge, AMC_SHORT);
  assert.equal(advancedCard.bestFor, AMC_DETAIL);
  assert.deepEqual(PACKAGE_ROWS.filter((row) => row.advanced && !row.standard).map((row) => row.label), [AMC_SHORT]);
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
    "../components/packages-data.ts", "../components/FAQ.tsx", "../components/Packages.tsx", "../content/homepage.content.ts",
    "../content/compare-packages.content.ts", "../app/(marketing)/compare-packages/compare-packages-view.tsx",
    "../app/(marketing)/compare-packages/page.tsx", "../app/(marketing)/checkout/components/checkout-experience.tsx",
    "../app/(marketing)/packages/[slug]/page.tsx", "../app/(public)/packages/page.tsx"
  ]) {
    assert.doesNotMatch(readFileSync(new URL(source, import.meta.url), "utf8"), retired, source);
  }
});

test("Packages page heading highlights Free, not inspection", () => {
  const source = readFileSync(new URL("../app/(public)/packages/page.tsx", import.meta.url), "utf8");
  const heading = source.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)![1];
  assert.match(heading, /<span className="accent-word">free<\/span>/);
  assert.doesNotMatch(heading, /<span[^>]*>\s*inspection/);
  assert.equal(heading.replace(/<[^>]+>|\{" "\}/g, " ").replace(/\s+/g, " ").trim(), "Book a free bathroom inspection.");
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
  const { KIT } = require("../components/kit.ts") as typeof import("../components/kit");
  assert.deepEqual(KIT.map((item) => [item.id, item.qty]), [
    ["vertical-grab-bars", 3], ["angled-grab-bar", 1], ["folding-bar", 1], ["anti-slip-coating", 1],
    ["anti-slip-mat-shower", 1], ["anti-slip-mat-post-shower", 1], ["shower-stool", 1], ["two-way-lock", 1],
    ["corner-safety", 1], ["drainage-solution", 4], ["slippers-one", 1], ["total-support-solution", 1],
    ["raised-toilet-seat", 1]
  ]);
  // The Packages page falls back to "Included" only for a component without a
  // quantity, so every canonical component must carry one.
  assert.ok(homepageContent.packagesSection.features.every((feature) => typeof feature.quantity === "number"));
  assert.equal(homepageContent.packagesSection.features.find((feature) => feature.id === "raised-toilet-seat")?.quantity, 1);
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
    "../app/(public)/contact/page.tsx", "../components/FAQ.tsx", "../content/homepage.content.ts"]) {
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
