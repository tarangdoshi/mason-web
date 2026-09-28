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
import PhotoSlot from "../components/PhotoSlot";
import CmsImage from "../app/components/cms-image";

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

test("every current rendered CMS photo keeps supplied alt or renders blank alt", () => {
  const bare = upload("image-bare-1200x1500-jpg", { alt: undefined });
  const site = resolvePublicSite({
    homepage: {
      hero: { backgroundImage: bare, backgroundImageMobile: bare },
      whatWeDoSection: { sideImage: bare },
      finalCtaSection: { backgroundImage: bare }
    },
    aboutPage: {
      hero: { image: bare }, story: { image: bare }, approach: { image: bare }, closing: { image: bare },
      team: { founders: [{ name: "Founder", bio: "Bio", photo: bare }] }
    },
    packagesPage: { image: bare },
    packages: [
      { code: "package-standard", includedFeatures: [{ key: "shower-stool", label: "Shower stool", image: bare }] },
      { code: "package-advanced", includedFeatures: [{ key: "shower-stool", label: "Shower stool", image: bare }] }
    ],
    doctors: [{ name: "Dr. Sample", quote: "Quote", photo: bare }],
    gallery: { sliderBefore: bare, sliderAfter: bare, tiles: [{ image: bare }] },
    siteSettings: { contactImage: bare }
  });
  const images = [
    site.home.hero.background.desktop, site.home.hero.background.mobile, site.home.safer.image,
    site.home.finalCta.image, site.about.hero.image, site.about.story.image,
    site.about.approach.image, site.about.closing.image, site.about.team.founders[0].photo,
    site.packagesPage.image, site.packages.components[0].image, site.home.doctors.items[0].photo,
    site.home.transformations.sliderBefore, site.home.transformations.sliderAfter,
    site.home.transformations.tiles[0].image, site.contactPage.image
  ];
  assert.ok(images.every((photo) => photo?.alt === ""));
  assert.ok(images.every((photo) => photo?.src.includes("image-bare")));

  const described = resolvePublicSite({
    homepage: { hero: { backgroundImage: upload("image-described-1200x1500-jpg", { alt: "Installed support beside the shower" }) } },
    doctors: [{ name: "Dr. Sample", quote: "Quote", photo: upload("image-doctor-1200x1500-jpg", { alt: "Doctor in the clinic" }) }]
  });
  assert.equal(described.home.hero.background.desktop.alt, "Installed support beside the shower");
  assert.equal(described.home.doctors.items[0].photo?.alt, "Doctor in the clinic");
  assert.equal(resolvePublicSite({ homepage: { whatWeDoSection: { sideImage: { fallbackSrc: "/prerna/images/bath-2.jpg", alt: null } } } }).home.safer.image.alt, "");

  for (const alt of ["", "Installed support beside the shower"]) {
    const markup = renderToStaticMarkup(React.createElement(CmsImage, {
      visual: { src: "/prerna/images/bath-2.jpg", alt }, width: 1200, height: 900
    }));
    assert.match(markup, new RegExp(`alt="${alt}"`));
    assert.doesNotMatch(markup, /alt="(?:undefined|null|image-bare-1200x1500-jpg|Dr\. Sample)"/);
  }
  const doctorsSource = readFileSync(new URL("../components/Doctors.tsx", import.meta.url), "utf8");
  assert.match(doctorsSource, /alt=\{doc\.photo\.alt\}/);
  const packagesPageSource = readFileSync(new URL("../app/(public)/packages/page.tsx", import.meta.url), "utf8");
  assert.match(packagesPageSource, /alt=\{item\.image\.alt\}/);
  const heroSource = readFileSync(new URL("../components/Hero.tsx", import.meta.url), "utf8");
  assert.match(heroSource, /alt=\{mobileBg\.alt\}/);
});

test("legacy Sanity image mapping does not turn blank alt into fallback copy", async () => {
  const { applySanityHomepage } = await import("./site-content");
  const { homepageContent } = await import("../content/homepage.content");
  const result = applySanityHomepage(homepageContent, {
    hero: {
      beforeVisual: { url: "https://cdn.sanity.io/images/p/d/before.jpg", alt: null },
      afterVisual: { url: "https://cdn.sanity.io/images/p/d/after.jpg", alt: "" }
    },
    whatWeDoSection: { visual: { url: "https://cdn.sanity.io/images/p/d/visit.jpg", alt: undefined } }
  }, null);
  assert.equal(result.hero.visual.beforeAlt, "");
  assert.equal(result.hero.visual.afterAlt, "");
  assert.equal(result.hero.visual.alt, "");
  assert.equal(result.whatWeDoSection.visual?.alt, "");
  const described = applySanityHomepage(homepageContent, {
    hero: { afterVisual: { url: "https://cdn.sanity.io/images/p/d/after.jpg", alt: "Grab bar fitted beside a shower" } }
  }, null);
  assert.equal(described.hero.visual.afterAlt, "Grab bar fitted beside a shower");
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

test("Gallery resolves and renders every alt/caption combination without empty markup", async () => {
  const site = resolvePublicSite({
    gallery: {
      sliderBefore: upload("image-before-1200x900-jpg", { alt: undefined }),
      sliderAfter: upload("image-after-1200x900-jpg", { alt: "After installation" }),
      tiles: [
        { label: "Alt and caption", image: upload("image-tile1-800x1000-jpg", { alt: "Described tile" }) },
        { image: upload("image-tile2-800x1000-jpg", { alt: undefined }) },
        { image: upload("image-tile3-800x1000-jpg", { alt: "Alt only" }) },
        { label: "Caption only", image: upload("image-tile4-800x1000-jpg", { alt: undefined }) },
        { label: "", image: null }
      ]
    },
    homepage: { whatWeDoSection: { sideImage: upload("image-side-1200x900-jpg", { alt: "Safer bathroom" }) } }
  });
  assert.equal(site.home.transformations.sliderBefore.alt, "");
  assert.equal(site.home.transformations.sliderAfter.alt, "After installation");
  assert.deepEqual(site.home.transformations.tiles.map((tile) => [tile.label, tile.image.alt]), [
    ["Alt and caption", "Described tile"], ["", ""], ["", "Alt only"], ["Caption only", ""]
  ]);
  assert.match(site.home.transformations.tiles[1].image.src, /image-tile2-800x1000-jpg/);
  assert.equal(site.home.safer.image.alt, "Safer bathroom");
  assert.deepEqual(resolvePublicSite(null).home.transformations, fallbackHome.transformations);
  const transformationsModule = await import("../components/Transformations");
  const Transformations = typeof transformationsModule.default === "function"
    ? transformationsModule.default
    : (transformationsModule.default as unknown as { default: typeof transformationsModule.default }).default;
  const content = {
    ...site.home.transformations,
    sliderBefore: { ...site.home.transformations.sliderBefore, src: "/prerna/images/bath-1.jpg" },
    sliderAfter: { ...site.home.transformations.sliderAfter, src: "/prerna/images/bath-1.jpg" },
    tiles: site.home.transformations.tiles.map((tile) => ({ ...tile, image: { ...tile.image, src: "/prerna/images/bath-2.jpg" } }))
  };
  const markup = renderToStaticMarkup(React.createElement(Transformations, { content }));
  assert.match(markup, /alt=""/);
  assert.match(markup, /alt="Described tile"/);
  assert.match(markup, /alt="Alt only"/);
  assert.match(markup, /<figcaption[^>]*>Alt and caption<\/figcaption>/);
  assert.match(markup, /<figcaption[^>]*>Caption only<\/figcaption>/);
  assert.equal((markup.match(/<figcaption/g) ?? []).length, 2);
  assert.doesNotMatch(markup, /<figcaption[^>]*>\s*<\/figcaption>|undefined/);
});

test("founder portraits use supplied alt and render decorative uploads with alt=\"\"", () => {
  const founders = resolvePublicSite({
    aboutPage: {
      team: {
        founders: [
          { name: "First Founder", bio: "Founder bio", photo: upload("image-first-800x1000-jpg", { alt: "First founder in the studio" }) },
          { name: "Second Founder", bio: "Founder bio", photo: upload("image-second-800x1000-jpg", { alt: undefined }) }
        ]
      }
    }
  }).about.team.founders;
  assert.deepEqual(founders.map((founder) => founder.photo?.alt), ["First founder in the studio", ""]);
  for (const founder of founders) {
    const markup = renderToStaticMarkup(React.createElement(PhotoSlot, {
      src: "/prerna/images/bath-2.jpg",
      alt: founder.photo?.alt ?? "",
      label: `Portrait — ${founder.name}`,
      className: "w-24 h-24"
    }));
    assert.match(markup, new RegExp(`alt="${founder.photo?.alt ?? ""}"`));
    assert.doesNotMatch(markup, /alt="(?:First|Second) Founder"|undefined/);
  }
  const aboutPage = readFileSync(new URL("../app/(public)/about/page.tsx", import.meta.url), "utf8");
  assert.match(aboutPage, /alt=\{f\.photo\?\.alt \?\? ""\}/, "the actual About page passes CMS alt to PhotoSlot");
});

test("About Our approach renders uploaded images with blank or supplied alt", () => {
  const aboutPage = readFileSync(new URL("../app/(public)/about/page.tsx", import.meta.url), "utf8");
  assert.match(aboutPage, /alt=\{about\.approach\.image\?\.alt\}/, "the actual About page passes resolved alt to PhotoSlot");
  for (const [alt, expected] of [[undefined, ""], ["Installer fitting a grab bar", "Installer fitting a grab bar"]] as const) {
    const photo = resolvePublicSite({ aboutPage: { approach: { image: upload("image-approach-1200x900-jpg", { alt }) } } }).about.approach.image;
    assert.equal(photo?.alt, expected);
    const markup = renderToStaticMarkup(React.createElement(PhotoSlot, {
      src: "/prerna/images/bath-2.jpg",
      alt: photo?.alt,
      label: "Installer at work"
    }));
    assert.match(markup, new RegExp(`alt="${expected}"`));
    assert.doesNotMatch(markup, /alt="(?:undefined|null|image-approach-1200x900-jpg)"/);
  }
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

test("package card Learn more scrolls to What we install on /packages, not a package-detail page", () => {
  const card = readFileSync(new URL("../components/PackageCard.tsx", import.meta.url), "utf8");
  const learnMore = card.match(/<Link href=("[^"]*"|\{[^}]*\})[^>]*>\s*Learn more/)?.[1];
  assert.equal(learnMore, '"/packages#kit"');
  assert.match(readFileSync(new URL("../app/(public)/packages/page.tsx", import.meta.url), "utf8"), /id="kit"/);
  // Direct links to a package's own components section keep working.
  const detail = readFileSync(new URL("../app/(marketing)/packages/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(detail, /id="components"/);
  assert.match(readFileSync(new URL("../app/(marketing)/packages/packages.module.css", import.meta.url), "utf8"), /\.anchorSection \{\s*scroll-margin-top: 1rem/);
});

test("package cards share row tracks side by side so their dividers line up", () => {
  const card = readFileSync(new URL("../components/PackageCard.tsx", import.meta.url), "utf8");
  assert.match(card, /lg:row-span-6 lg:grid lg:grid-rows-subgrid lg:gap-y-0/);
  for (const parent of ["../components/Packages.tsx", "../app/(public)/packages/page.tsx"]) {
    assert.match(readFileSync(new URL(parent, import.meta.url), "utf8"), /lg:grid-cols-2 lg:grid-rows-\[auto_auto_auto_auto_auto_1fr\] lg:gap-y-0/, parent);
  }
  assert.equal(fallbackPackages.plans.length, 2);
});
