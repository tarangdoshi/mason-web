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

test("both packages include Raised Toilet Seat without an assumed quantity", () => {
  for (const plan of homepageContent.packagesSection.plans) {
    const entry = getPackageCatalogEntry(plan.id);
    assert.ok(entry);
    assert.equal(getIncludedFeatures(entry).length, 13);
    const raisedSeat = getIncludedFeatures(entry).find((feature) => feature.id === "raised-toilet-seat");
    assert.equal(raisedSeat?.label, "Raised Toilet Seat");
    assert.equal(raisedSeat?.quantity, undefined);
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

test("form notice is smaller, says T&C apply and keeps its Terms link", () => {
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(LeadPrivacyNotice)));
  const notice = dom.window.document.querySelector("p");
  assert.equal(notice?.textContent, "T&C apply");
  assert.equal(notice?.style.fontSize, "0.75rem");
  assert.equal(notice?.querySelector("a")?.getAttribute("href"), "/terms");
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
    assert.doesNotMatch(source, /safety(\s|<[^>]*>|\{" "\})+(visit|assessment)/i, surface);
  }
});
