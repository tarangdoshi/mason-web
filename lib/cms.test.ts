import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { fallbackAbout, fallbackHome, fallbackPackages, fallbackSettings } from "./cms/fallback";
import { withContactDetails } from "./cms/legal";
import { hotspotPosition, resolvePublicSite, type RawPayload } from "./cms/resolve";
import { parsePackagePrice } from "./analytics";
import { PRIVACY, TERMS } from "../components/legal-data";
import HighlightedText from "../components/HighlightedText";

process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||= "testproject";
Object.defineProperty(globalThis, "React", { value: React, configurable: true });

const upload = (ref: string, extra: Record<string, unknown> = {}) => ({
  asset: { _ref: ref },
  resolvedSrc: `https://cdn.sanity.io/images/p/d/${ref}.jpg?w=2400`,
  resolvedSrcSet: `https://cdn.sanity.io/images/p/d/${ref}.jpg?w=480 480w, https://cdn.sanity.io/images/p/d/${ref}.jpg?w=2400 2400w`,
  alt: "Uploaded photo",
  ...extra
});

test("no Sanity data renders the approved fallback content", () => {
  const site = resolvePublicSite(null);
  assert.deepEqual(site.home, { ...fallbackHome, faq: { ...fallbackHome.faq, items: site.home.faq.items } });
  assert.deepEqual(site.settings, fallbackSettings);
  assert.deepEqual(site.about, fallbackAbout);
  assert.deepEqual(site.packages.plans.map((plan) => [plan.name, plan.price, plan.referencePrice]), [["Standard", "₹29,999", "₹35,000"], ["Advanced", "₹36,999", "₹44,000"]]);
});

test("a published hero, CTA label and section copy win; missing fields keep the fallback", () => {
  const site = resolvePublicSite({ homepage: { hero: { heading: "New Founder Hero", subcopy: "  " } } });
  assert.deepEqual(site.home.hero.heading, { text: "New Founder Hero", highlights: [] });
  assert.equal(site.home.hero.subcopy, fallbackHome.hero.subcopy, "blank field falls back");
  assert.equal(site.home.hero.primaryCta, fallbackHome.hero.primaryCta, "missing field falls back");
});

test("FAQs can be reordered, hidden and edited; price placeholders use the live price", () => {
  const site = resolvePublicSite({
    faqs: {
      items: [
        { question: "Second becomes first?", answer: "Yes." },
        { question: "Hidden one", answer: "Not shown", hidden: true },
        { question: "Price?", answer: "Standard is {standard_price}; Advanced is {advanced_price}." }
      ]
    },
    packages: [{ code: "package-standard", priceInr: 31999 }, { code: "package-advanced", priceInr: 38999 }]
  });
  assert.deepEqual(site.home.faq.items.map((item) => item.question), ["Second becomes first?", "Price?"]);
  assert.equal(site.home.faq.items[1].answer, "Standard is ₹31,999; Advanced is ₹38,999.");
});

test("testimonials and doctors follow the CMS, including hide and order", () => {
  const site = resolvePublicSite({
    testimonials: [
      { name: "Asha Kamat", relation: "Daughter", city: "Margao", quote: "Changed quote" },
      { name: "Hidden Person", relation: "Son", city: "Goa", quote: "x", isHidden: true }
    ],
    doctors: [{ name: "Dr. New", specialty: "MBBS", registration: "Goa", quote: "Quote", photo: upload("image-abc-800x1000-jpg", { hotspot: { x: 0.5, y: 0.2 } }) }]
  });
  assert.deepEqual(site.home.testimonials.items, [{ name: "Asha Kamat", relation: "Daughter", city: "Margao", quote: "Changed quote" }]);
  assert.equal(site.home.doctors.items[0].photo?.src.startsWith("https://cdn.sanity.io/"), true);
  assert.equal(site.home.doctors.items[0].photo?.objectPosition, "50% 20%");
});

test("an uploaded image replaces the bundled one, is framed by its hotspot and carries responsive sizes", () => {
  const site = resolvePublicSite({ homepage: { whatWeDoSection: { sideImage: upload("image-side-2400x1800-jpg", { hotspot: { x: 0.3, y: 0.7 }, objectPosition: "50% 70%" }) } } });
  const photo = site.home.safer.image;
  assert.match(photo.src, /^https:\/\/cdn\.sanity\.io\//);
  assert.match(photo.srcSet ?? "", /480w/);
  assert.equal(photo.objectPosition, "30% 70%", "hotspot wins for uploads; the old bundled position is ignored");
  assert.equal(hotspotPosition({ x: 0.333, y: 1.4 }), "33.3% 100%");
});

test("hero background: one master serves every screen; the mobile override is optional", () => {
  const masterOnly = resolvePublicSite({ homepage: { hero: { backgroundImage: upload("image-hero-2400x1600-jpg") } } }).home.hero.background;
  assert.equal(masterOnly.mobile, undefined, "the master alone replaces the bundled portrait crop too");
  const withOverride = resolvePublicSite({
    homepage: { hero: { backgroundImage: upload("image-hero-2400x1600-jpg"), backgroundImageMobile: upload("image-heroport-1200x2000-jpg") } }
  }).home.hero.background;
  assert.match(withOverride.mobile?.src ?? "", /heroport/);
  const none = resolvePublicSite(null).home.hero.background;
  assert.deepEqual(none, fallbackHome.hero.background);
});

test("contact details are validated and reach the legal pages", () => {
  const good = resolvePublicSite({ siteSettings: { supportEmail: "help@masoncompany.in", supportHours: "Every weekday, 9 am to 6 pm", phoneDisplay: "+91 98200 12345", phoneTel: "+919820012345" } }).settings.contact;
  assert.deepEqual(good, { supportEmail: "help@masoncompany.in", supportHours: "Every weekday, 9 am to 6 pm", phoneDisplay: "+91 98200 12345", phoneHref: "tel:+919820012345", whatsappUrl: fallbackSettings.contact.whatsappUrl });
  const bad = resolvePublicSite({ siteSettings: { supportEmail: "not-an-email", phoneTel: "12345", whatsappUrl: "https://evil.example/" } }).settings.contact;
  assert.deepEqual(bad, fallbackSettings.contact);
  for (const doc of [PRIVACY, TERMS]) {
    const text = JSON.stringify(withContactDetails(doc, good));
    assert.match(text, /help@masoncompany\.in/);
    assert.match(text, /tel:\+919820012345/);
    assert.doesNotMatch(text, /support@masoncompany\.in|8149433383/);
  }
});

test("package components: a CMS name or quantity change shows on both packages", () => {
  const raised = { key: "raised-toilet-seat", label: "Raised Toilet Seat (comfort height)", quantity: 2 };
  const payload: RawPayload = {
    packages: [
      { code: "package-standard", includedFeatures: [raised, { key: "shower-stool", label: "Shower seat" }] },
      { code: "package-advanced", includedFeatures: [raised] }
    ]
  };
  const { packages, packagesPage } = resolvePublicSite(payload);
  assert.deepEqual(packages.components.map((c) => [c.id, c.title, c.quantity]), [["raised-toilet-seat", "Raised Toilet Seat (comfort height)", 2], ["shower-stool", "Shower seat", 1]]);
  assert.deepEqual(packages.plans.map((plan) => plan.componentIds), [["raised-toilet-seat", "shower-stool"], ["raised-toilet-seat"]]);
  assert.equal(packages.rows[0].label, "2 safety upgrades installed");
  assert.match(packagesPage.kitFootnote, /^All 2 are fitted/);
});

test("one Sanity price reaches cards, detail/checkout plan, FAQ text and the analytics value", async () => {
  const payload: RawPayload = {
    packages: [{ code: "package-standard", priceInr: 32500, referencePriceInr: 38000 }, { code: "package-advanced", priceInr: 39500 }],
    faqs: { items: [{ question: "What packages do you offer?", answer: "Standard at {standard_price} and Advanced at {advanced_price}." }] },
    homepage: { packagesSection: { subtitle: "From {standard_price}." } }
  };
  const site = resolvePublicSite(payload);
  const { toLegacyPlan } = await import("./site-content");
  const [standard, advanced] = site.packages.plans;
  assert.deepEqual([standard.price, standard.referencePrice, advanced.price, advanced.referencePrice], ["₹32,500", "₹38,000", "₹39,500", undefined]);
  // Package detail + checkout use the legacy plan shape built from the same plan.
  const legacyStandard = toLegacyPlan(standard);
  assert.deepEqual([legacyStandard.price, legacyStandard.currentPrice, legacyStandard.referencePrice], ["₹32,500", "₹32,500", "₹38,000"]);
  // select_package / view_package send the parsed card price.
  assert.equal(parsePackagePrice(standard.price), 32500);
  assert.equal(parsePackagePrice(advanced.price), 39500);
  assert.equal(site.home.faq.items[0].answer, "Standard at ₹32,500 and Advanced at ₹39,500.");
  assert.equal(site.home.packages.subtitle, "From ₹32,500.");
  // Invalid prices never reach the page.
  const invalid = resolvePublicSite({ packages: [{ code: "package-standard", priceInr: 12.5 }, { code: "package-advanced", priceInr: 99 }] }).packages.plans;
  assert.deepEqual(invalid.map((plan) => plan.price), ["₹29,999", "₹36,999"]);
});

test("highlighted words: accent the phrase (last occurrence), keep line breaks, never render HTML", () => {
  const html = renderToStaticMarkup(
    React.createElement(HighlightedText, {
      value: { text: "Safety at home should feel like home.\n<b>Line two</b>", highlights: ["home", "missing"] },
      renderLine: (line: React.ReactNode, index: number) => React.createElement("span", { key: index, "data-line": index }, line)
    })
  );
  assert.equal(html, 'Safety at home should feel like <span class="accent-word">home</span>.'.replace(/^/, '<span data-line="0">') + '</span><span data-line="1">&lt;b&gt;Line two&lt;/b&gt;</span>');
});

test("draft preview can only be switched on with a valid secret", async () => {
  const previous = { secret: process.env.SANITY_PREVIEW_SECRET, token: process.env.SANITY_API_READ_TOKEN };
  process.env.SANITY_PREVIEW_SECRET = "correct-secret";
  delete process.env.SANITY_API_READ_TOKEN;
  try {
    const { GET } = await import("../app/api/draft-mode/enable/route");
    assert.equal((await GET(new Request("https://www.masoncompany.in/api/draft-mode/enable"))).status, 401);
    assert.equal((await GET(new Request("https://www.masoncompany.in/api/draft-mode/enable?secret=wrong"))).status, 401);
    // A Studio preview secret is never accepted without the server-side read token.
    assert.equal((await GET(new Request("https://www.masoncompany.in/api/draft-mode/enable?sanity-preview-secret=guess"))).status, 500);
  } finally {
    if (previous.secret === undefined) delete process.env.SANITY_PREVIEW_SECRET; else process.env.SANITY_PREVIEW_SECRET = previous.secret;
    if (previous.token !== undefined) process.env.SANITY_API_READ_TOKEN = previous.token;
  }
});

test("drafts are only ever requested while Next draft mode is on", () => {
  const loader = readFileSync(new URL("./cms/load.ts", import.meta.url), "utf8");
  assert.match(loader, /const preview = await isPreviewingDrafts\(\);/);
  assert.match(loader, /createSanityClient\(\{ preview: Boolean\(preview && token\), token \}\)/);
  assert.match(loader, /return \(await draftMode\(\)\)\.isEnabled;/);
});

test("package card Learn more links to that package's components section", () => {
  const card = readFileSync(new URL("../components/PackageCard.tsx", import.meta.url), "utf8");
  assert.match(card, /href=\{`\/packages\/\$\{plan\.slug\}#components`\}/);
  const detail = readFileSync(new URL("../app/(marketing)/packages/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(detail, /id="components"/);
  assert.match(readFileSync(new URL("../app/(marketing)/packages/packages.module.css", import.meta.url), "utf8"), /\.anchorSection \{\s*scroll-margin-top/);
});

test("package cards share row tracks side by side so their dividers line up", () => {
  const card = readFileSync(new URL("../components/PackageCard.tsx", import.meta.url), "utf8");
  assert.match(card, /lg:row-span-6 lg:grid lg:grid-rows-subgrid lg:gap-y-0/);
  for (const parent of ["../components/Packages.tsx", "../app/(public)/packages/page.tsx"]) {
    assert.match(readFileSync(new URL(parent, import.meta.url), "utf8"), /lg:grid-cols-2 lg:grid-rows-\[auto_auto_auto_auto_auto_1fr\] lg:gap-y-0/, parent);
  }
  assert.equal(fallbackPackages.plans.length, 2);
});
