/* CMS-first resolution for the public site.

   Rule: a valid Sanity value wins; the fallback is used only when the
   document is missing or the field is empty/invalid. Nothing here forces a
   code value over a valid published one. Pure functions — no fetching — so
   every rule is unit-testable. */

import {
  fallbackAbout,
  fallbackContactPage,
  fallbackHome,
  fallbackPackages,
  fallbackPackagesPage,
  fallbackSettings
} from "./fallback";
import type {
  AboutContent,
  CmsImage,
  ContactPageContent,
  ContactSettings,
  Heading,
  HomeContent,
  PackageCode,
  PackageRow,
  PackagesContent,
  PackagesPageContent,
  PublicSiteContent,
  ResolvedComponent,
  ResolvedPlan,
  SeoContent,
  SeoEntry,
  SeoPageKey,
  SiteSettingsContent
} from "./model";

/* ------------------------------------------------------------------ raw */

export type RawImage = {
  alt?: string | null;
  hotspot?: { x?: number; y?: number } | null;
  fallbackSrc?: string | null;
  objectPosition?: string | null;
  /** Filled by the image-url builder in load.ts when an asset is present. */
  resolvedSrc?: string | null;
  resolvedSrcSet?: string | null;
} | null;

type RawHeadingFields = { heading?: string | null; headingHighlights?: (string | null)[] | null };

export type RawFeature = {
  key?: string | null;
  label?: string | null;
  publicLabel?: string | null;
  category?: string | null;
  quantity?: number | null;
  description?: string | null;
  publicDescription?: string | null;
  image?: RawImage;
};

export type RawPackage = {
  code?: string | null;
  badge?: string | null;
  titleDescriptor?: string | null;
  bestFor?: string | null;
  outcome?: string | null;
  priceInr?: number | null;
  referencePriceInr?: number | null;
  savings?: string | null;
  ctaLabel?: string | null;
  isFeatured?: boolean | null;
  visualHighlights?: (string | null)[] | null;
  includedFeatures?: (RawFeature | null)[] | null;
};

export type RawPayload = {
  homepage?: Record<string, unknown> | null;
  siteSettings?: Record<string, unknown> | null;
  faqs?: Record<string, unknown> | null;
  packagesPage?: Record<string, unknown> | null;
  aboutPage?: Record<string, unknown> | null;
  gallery?: Record<string, unknown> | null;
  seo?: Record<string, unknown> | null;
  packages?: RawPackage[] | null;
  testimonials?: Record<string, unknown>[] | null;
  doctors?: Record<string, unknown>[] | null;
} | null;

/* -------------------------------------------------------------- helpers */

type Obj = Record<string, unknown> | null | undefined;

const asObj = (value: unknown): Obj => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null);

/** A non-empty string from the CMS, otherwise the fallback. */
export function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function optionalText(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

/** A CMS string list with blanks removed; the fallback only when the CMS has none. */
export function textList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
  return items.length ? items : fallback;
}

/** Heading text wins as a unit with its highlights: once the editor has
    written a heading, only the highlights they chose (that actually occur in
    it) are styled — the fallback's highlights never leak onto CMS text. */
export function heading(source: Obj, fallback: Heading, textField = "heading", highlightsField = "headingHighlights"): Heading {
  const value = source?.[textField];
  if (typeof value !== "string" || !value.trim()) return fallback;
  const headingText = value.trim();
  const highlights = Array.isArray(source?.[highlightsField])
    ? (source![highlightsField] as unknown[])
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim())
        .filter((item) => headingText.includes(item))
    : [];
  return { text: headingText, highlights };
}

export function image(value: unknown, fallback: CmsImage): CmsImage {
  const raw = asObj(value) as RawImage;
  const src = raw?.resolvedSrc || raw?.fallbackSrc;
  if (!src || !(src.startsWith("/") || src.startsWith("https://"))) return fallback;
  return {
    src,
    ...(raw?.resolvedSrcSet ? { srcSet: raw.resolvedSrcSet } : {}),
    alt: optionalText(raw?.alt) ?? fallback.alt,
    ...(() => {
      // An uploaded image is framed by its hotspot (the editor's focal point);
      // an explicit position only ever applies to a bundled site image.
      const position = raw?.resolvedSrc
        ? hotspotPosition(raw?.hotspot)
        : optionalText(raw?.objectPosition) ?? fallback.objectPosition;
      return position ? { objectPosition: position } : {};
    })()
  };
}

/** The editor's focal point (Sanity hotspot, 0–1) as CSS object-position, so
    `object-cover` crops around it at every viewport. */
export function hotspotPosition(hotspot: { x?: number; y?: number } | null | undefined): string | undefined {
  if (!hotspot || typeof hotspot.x !== "number" || typeof hotspot.y !== "number") return undefined;
  const pct = (value: number) => `${Math.round(Math.min(1, Math.max(0, value)) * 1000) / 10}%`;
  return `${pct(hotspot.x)} ${pct(hotspot.y)}`;
}

/* --------------------------------------------------------------- prices */

export const MIN_PRICE_INR = 1000;
export const MAX_PRICE_INR = 10_000_000;

export function isValidPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_PRICE_INR && value <= MAX_PRICE_INR;
}

/** 29999 → "₹29,999" (Indian digit grouping). */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Replaces {standard_price} / {advanced_price} in editor copy with the
    resolved prices, so prose can never disagree with the price cards. */
export function applyPriceTokens(value: string, plans: ResolvedPlan[]): string {
  const byCode = new Map(plans.map((plan) => [plan.code, plan]));
  return value
    .replace(/\{standard_price\}/g, byCode.get("package-standard")?.price ?? "{standard_price}")
    .replace(/\{advanced_price\}/g, byCode.get("package-advanced")?.price ?? "{advanced_price}");
}

/* --------------------------------------------------------------- phones */

/** "+91 81494 33383", "08149433383", "918149433383" → "+918149433383". */
export function toIndianMobileE164(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const digits = value.replace(/\D/g, "");
  const national = digits.length === 10 ? digits : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : null;
  return national && /^[6-9]\d{9}$/.test(national) ? `+91${national}` : null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/* ------------------------------------------------------------- settings */

export function resolveSettings(raw: Obj): SiteSettingsContent {
  const fb = fallbackSettings;
  const email = typeof raw?.supportEmail === "string" && EMAIL_PATTERN.test(raw.supportEmail.trim()) ? raw.supportEmail.trim() : fb.contact.supportEmail;
  const e164 = toIndianMobileE164(raw?.phoneTel) ?? toIndianMobileE164(raw?.phoneDisplay);
  const whatsapp = typeof raw?.whatsappUrl === "string" && /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(raw.whatsappUrl.trim()) ? raw.whatsappUrl.trim() : fb.contact.whatsappUrl;
  const contact: ContactSettings = {
    supportEmail: email,
    supportHours: text(raw?.supportHours, fb.contact.supportHours),
    phoneDisplay: e164 ? text(raw?.phoneDisplay, fb.contact.phoneDisplay) : fb.contact.phoneDisplay,
    phoneHref: e164 ? `tel:${e164}` : fb.contact.phoneHref,
    whatsappUrl: whatsapp
  };
  return {
    contact,
    footer: {
      heading: heading(raw, fb.footer.heading, "footerHeading", "footerHeadingHighlights"),
      ctaLabel: text(raw?.footerCtaLabel, fb.footer.ctaLabel),
      tagline: text(raw?.footerTagline, fb.footer.tagline)
    },
    doctorDisclaimer: text(raw?.doctorDisclaimer, fb.doctorDisclaimer)
  };
}

/* ------------------------------------------------------------- packages */

const PLAN_CODES: PackageCode[] = ["package-standard", "package-advanced"];

function resolveComponent(raw: RawFeature, fallbackById: Map<string, ResolvedComponent>): ResolvedComponent | null {
  const id = optionalText(raw.key);
  if (!id) return null;
  const fb = fallbackById.get(id);
  const title = optionalText(raw.label) ?? optionalText(raw.publicLabel) ?? fb?.title;
  if (!title) return null;
  const quantity = typeof raw.quantity === "number" && Number.isInteger(raw.quantity) && raw.quantity >= 0 ? raw.quantity : fb?.quantity;
  const description = optionalText(raw.description) ?? optionalText(raw.publicDescription) ?? fb?.description;
  return {
    id,
    title,
    category: text(raw.category, fb?.category ?? ""),
    ...(quantity !== undefined ? { quantity } : {}),
    ...(description ? { description } : {}),
    image: image(raw.image, fb?.image ?? { src: "/prerna/images/bath-3.jpg", alt: "" })
  };
}

export function resolvePackages(rawPackages: RawPackage[] | null | undefined, rawPage: Obj): PackagesContent {
  const fb = fallbackPackages;
  const fallbackById = new Map(fb.components.map((component) => [component.id, component]));
  const componentsById = new Map<string, ResolvedComponent>();

  const plans: ResolvedPlan[] = PLAN_CODES.map((code) => {
    const fallbackPlan = fb.plans.find((plan) => plan.code === code)!;
    const raw = (rawPackages || []).find((pkg) => pkg?.code === code);
    if (!raw) {
      for (const id of fallbackPlan.componentIds) componentsById.set(id, componentsById.get(id) ?? fallbackById.get(id)!);
      return fallbackPlan;
    }

    // Pricing is CMS-managed once a valid selling price is set on the
    // package. From then on the struck-through reference price is exactly what
    // the editor set (or none) — never silently re-added from code.
    const cmsPrice = isValidPrice(raw.priceInr) ? raw.priceInr : null;
    const priceInr = cmsPrice ?? fallbackPlan.priceInr;
    const referencePriceInr = cmsPrice !== null
      ? isValidPrice(raw.referencePriceInr) && raw.referencePriceInr > cmsPrice ? raw.referencePriceInr : undefined
      : fallbackPlan.referencePriceInr;

    const resolvedComponents = (raw.includedFeatures || [])
      .map((feature) => (feature ? resolveComponent(feature, fallbackById) : null))
      .filter((component): component is ResolvedComponent => Boolean(component));
    const componentIds = resolvedComponents.length ? resolvedComponents.map((component) => component.id) : fallbackPlan.componentIds;
    for (const component of resolvedComponents) componentsById.set(component.id, component);
    if (!resolvedComponents.length) for (const id of fallbackPlan.componentIds) componentsById.set(id, componentsById.get(id) ?? fallbackById.get(id)!);

    return {
      ...fallbackPlan,
      badge: text(raw.badge, fallbackPlan.badge),
      titleDescriptor: text(raw.titleDescriptor, fallbackPlan.titleDescriptor),
      bestFor: text(raw.bestFor, fallbackPlan.bestFor),
      outcome: text(raw.outcome, fallbackPlan.outcome),
      isPopular: typeof raw.isFeatured === "boolean" ? raw.isFeatured : fallbackPlan.isPopular,
      priceInr,
      price: formatInr(priceInr),
      ...(referencePriceInr !== undefined ? { referencePriceInr, referencePrice: formatInr(referencePriceInr) } : { referencePriceInr: undefined, referencePrice: undefined }),
      savings: text(raw.savings, fallbackPlan.savings),
      ctaLabel: text(raw.ctaLabel, fallbackPlan.ctaLabel),
      visualHighlights: textList(raw.visualHighlights, fallbackPlan.visualHighlights),
      componentIds
    };
  });

  const componentOrder: string[] = [];
  for (const plan of plans) for (const id of plan.componentIds) if (!componentOrder.includes(id)) componentOrder.push(id);
  const components = componentOrder.map((id) => componentsById.get(id)).filter((component): component is ResolvedComponent => Boolean(component));

  const rawRows = Array.isArray(rawPage?.cardRows) ? (rawPage!.cardRows as Obj[]) : [];
  const rows: PackageRow[] = rawRows
    .map((row) => (optionalText(row?.label) ? { label: row!.label as string, standard: row?.standard === true, advanced: row?.advanced === true } : null))
    .filter((row): row is PackageRow => Boolean(row));

  return {
    plans: plans.map((plan) => ({
      ...plan,
      bestFor: applyPriceTokens(plan.bestFor, plans),
      outcome: applyPriceTokens(plan.outcome, plans)
    })),
    components,
    rows: (rows.length ? rows : fb.rows).map((row) => ({ ...row, label: row.label.replace(/\{count\}/g, String(components.length)) })),
    popularLabel: text(rawPage?.popularLabel, fb.popularLabel),
    homeCardCta: text(rawPage?.homeCardCta, fb.homeCardCta),
    pageCardCta: text(rawPage?.pageCardCta, fb.pageCardCta)
  };
}

export function resolvePackagesPage(raw: Obj, packages: PackagesContent): PackagesPageContent {
  const fb = fallbackPackagesPage;
  const count = String(packages.components.length);
  return {
    eyebrow: text(raw?.eyebrow, fb.eyebrow),
    heading: heading(raw, fb.heading),
    subcopy: text(raw?.subcopy, fb.subcopy),
    scrollCue: text(raw?.scrollCue, fb.scrollCue),
    image: image(raw?.image, fb.image),
    chooseLabel: text(raw?.chooseLabel, fb.chooseLabel),
    chooseNote: text(raw?.chooseNote, fb.chooseNote),
    kitCue: text(raw?.kitCue, fb.kitCue),
    kitHeading: text(raw?.kitHeading, fb.kitHeading),
    kitNote: text(raw?.kitNote, fb.kitNote),
    kitFootnote: text(raw?.kitFootnote, fb.kitFootnote).replace(/\{count\}/g, count)
  };
}

/* ------------------------------------------------------------- homepage */

/** A master image plus an optional mobile override. Once the editor sets a
    master, the code's separate mobile crop is dropped (unless they also set a
    mobile override) so one upload always changes the image on every device. */
function resolveArtDirected(master: unknown, mobile: unknown, fallback: { desktop: CmsImage; mobile?: CmsImage }) {
  const desktop = image(master, fallback.desktop);
  const masterSet = desktop !== fallback.desktop;
  const mobileImage = image(mobile, masterSet ? desktop : fallback.mobile ?? desktop);
  return mobileImage === desktop ? { desktop } : { desktop, mobile: mobileImage };
}

function resolveItems<T>(value: unknown, map: (item: Obj, index: number) => T | null, fallback: T[]): T[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item, index) => map(asObj(item), index)).filter((item): item is T => item !== null);
  return items.length ? items : fallback;
}

export function resolveHome(payload: RawPayload, packages: PackagesContent): HomeContent {
  const fb = fallbackHome;
  const h = asObj(payload?.homepage);
  const hero = asObj(h?.hero);
  const evidence = asObj(h?.evidenceSection);
  const safer = asObj(h?.whatWeDoSection);
  const why = asObj(h?.whySection);
  // The gallery has its own Studio document; the old homepage section is a fallback.
  const transformations = asObj(payload?.gallery) ?? asObj(h?.transformationGallerySection);
  const pkgs = asObj(h?.packagesSection);
  const process = asObj(h?.processSection);
  const doctors = asObj(h?.doctorsSection);
  const testimonials = asObj(h?.testimonialsSection);
  const finalCta = asObj(h?.finalCtaSection);
  const faqs = asObj(payload?.faqs);

  const doctorDocs = (payload?.doctors || []).map(asObj).filter((doc) => doc && doc.isHidden !== true);
  const testimonialDocs = (payload?.testimonials || []).map(asObj).filter((doc) => doc && doc.isHidden !== true);

  return {
    hero: {
      heading: heading(hero, fb.hero.heading),
      subcopy: text(hero?.subcopy, fb.hero.subcopy),
      primaryCta: text(hero?.primaryCta, fb.hero.primaryCta),
      secondaryCta: text(hero?.secondaryCta, fb.hero.secondaryCta),
      background: resolveArtDirected(hero?.backgroundImage, hero?.backgroundImageMobile, fb.hero.background)
    },
    stats: {
      eyebrow: text(evidence?.eyebrow, fb.stats.eyebrow),
      heading: heading(evidence, fb.stats.heading),
      costLabel: text(evidence?.costLabel, fb.stats.costLabel),
      costPrefix: text(evidence?.costPrefix, fb.stats.costPrefix),
      costFigure: text(evidence?.costFigure, fb.stats.costFigure),
      cards: resolveItems(
        evidence?.cards,
        (card) => {
          const value = optionalText(card?.value);
          const copy = optionalText(card?.label);
          if (!value || !copy) return null;
          const prefix = optionalText(card?.prefix);
          return { ...(prefix ? { prefix } : {}), value, label: optionalText(card?.kicker) ?? optionalText(card?.sourceLabel) ?? "", copy };
        },
        fb.stats.cards
      ).slice(0, 4),
      sourcesNote: text(evidence?.sourcesNote, fb.stats.sourcesNote)
    },
    safer: {
      heading: heading(safer, fb.safer.heading),
      description: text(safer?.description, fb.safer.description),
      image: image(safer?.sideImage, fb.safer.image)
    },
    why: {
      eyebrow: text(why?.eyebrow, fb.why.eyebrow),
      heading: heading(why, fb.why.heading),
      subtitle: text(why?.intro, fb.why.subtitle),
      items: resolveItems(
        why?.items,
        (item, index) => {
          const title = optionalText(item?.title);
          const description = optionalText(item?.description);
          if (!title || !description) return null;
          return { title, description, tag: text(item?.tag, fb.why.items[index]?.tag ?? "") };
        },
        fb.why.items
      )
    },
    transformations: {
      eyebrow: text(transformations?.eyebrow, fb.transformations.eyebrow),
      heading: heading(transformations, fb.transformations.heading),
      subtitle: text(transformations?.subtitle, fb.transformations.subtitle),
      sliderBefore: image(transformations?.sliderBefore, fb.transformations.sliderBefore),
      sliderAfter: image(transformations?.sliderAfter, fb.transformations.sliderAfter),
      tiles: resolveItems(
        transformations?.tiles,
        (tile, index) => {
          if (tile?.hidden === true) return null;
          const label = optionalText(tile?.label);
          const fallbackTile = fb.transformations.tiles[index] ?? fb.transformations.tiles[0];
          const tileImage = image(tile?.image, { ...fallbackTile.image, alt: label ?? fallbackTile.image.alt });
          return label ? { image: tileImage, label } : null;
        },
        fb.transformations.tiles
      )
    },
    packages: {
      eyebrow: text(pkgs?.eyebrow, fb.packages.eyebrow),
      heading: heading(pkgs, fb.packages.heading),
      subtitle: applyPriceTokens(text(pkgs?.subtitle, fb.packages.subtitle), packages.plans),
      footnote: text(pkgs?.footnote, fb.packages.footnote)
    },
    process: {
      eyebrow: text(process?.eyebrow, fb.process.eyebrow),
      heading: heading(process, fb.process.heading),
      subtitle: text(process?.intro, fb.process.subtitle),
      ctaLabel: text(process?.primaryCta, fb.process.ctaLabel),
      steps: resolveItems(
        process?.websiteSteps,
        (step) => {
          const title = optionalText(step?.title);
          const description = optionalText(step?.description);
          return title && description ? { title, description } : null;
        },
        fb.process.steps
      )
    },
    doctors: {
      eyebrow: text(doctors?.eyebrow, fb.doctors.eyebrow),
      heading: heading(doctors, fb.doctors.heading),
      subtitle: text(doctors?.intro, fb.doctors.subtitle),
      items: doctorDocs.length
        ? resolveItems(
            doctorDocs,
            (doc) => {
              const name = optionalText(doc?.name);
              const quote = optionalText(doc?.quote);
              if (!name || !quote) return null;
              const photo = asObj(doc?.photo);
              return {
                name,
                credentials: text(doc?.specialty, ""),
                meta: text(doc?.registration, ""),
                quote,
                ...(photo && (photo.resolvedSrc || photo.fallbackSrc) ? { photo: image(photo, { src: "", alt: name }) } : {})
              };
            },
            fb.doctors.items
          )
        : fb.doctors.items
    },
    testimonials: {
      eyebrow: text(testimonials?.eyebrow, fb.testimonials.eyebrow),
      heading: heading(testimonials, fb.testimonials.heading),
      subtitle: text(testimonials?.intro, fb.testimonials.subtitle),
      items: testimonialDocs.length
        ? resolveItems(
            testimonialDocs,
            (doc) => {
              const name = optionalText(doc?.name);
              const quote = optionalText(doc?.quote);
              if (!name || !quote) return null;
              return { name, relation: text(doc?.relation, ""), city: text(doc?.city, ""), quote };
            },
            fb.testimonials.items
          )
        : fb.testimonials.items
    },
    faq: {
      eyebrow: text(faqs?.eyebrow, fb.faq.eyebrow),
      heading: heading(faqs, fb.faq.heading),
      subtitle: text(faqs?.intro, fb.faq.subtitle),
      items: resolveItems(
        faqs?.items,
        (item) => {
          const question = optionalText(item?.question);
          const answer = optionalText(item?.answer);
          if (!question || !answer || item?.hidden === true) return null;
          return { question, answer };
        },
        fb.faq.items
      ).map((item) => ({ ...item, answer: applyPriceTokens(item.answer, packages.plans) }))
    },
    finalCta: {
      eyebrow: text(finalCta?.eyebrow, fb.finalCta.eyebrow),
      heading: heading(finalCta, fb.finalCta.heading),
      subtitle: text(finalCta?.subtitle, fb.finalCta.subtitle),
      ctaLabel: text(finalCta?.primaryCta, fb.finalCta.ctaLabel),
      badges: textList(finalCta?.badges, fb.finalCta.badges),
      image: image(finalCta?.backgroundImage, fb.finalCta.image)
    }
  };
}

/* ------------------------------------------------------ contact page, SEO */

export function resolveContactPage(raw: Obj): ContactPageContent {
  const fb = fallbackContactPage;
  return {
    eyebrow: text(raw?.contactEyebrow, fb.eyebrow),
    heading: heading(raw, fb.heading, "contactHeading", "contactHeadingHighlights"),
    intro: text(raw?.contactIntro, fb.intro),
    image: image(raw?.contactImage, fb.image),
    cardTitle: text(raw?.contactCardTitle, fb.cardTitle),
    cardBody: text(raw?.contactCardBody, fb.cardBody),
    callLabel: text(raw?.contactCallLabel, fb.callLabel),
    hoursLabel: text(raw?.contactHoursLabel, fb.hoursLabel),
    emailLabel: text(raw?.contactEmailLabel, fb.emailLabel)
  };
}

const SEO_KEYS: SeoPageKey[] = ["home", "about", "packages", "packageStandard", "packageAdvanced", "contact", "why", "privacy", "terms"];

export function resolveSeo(raw: Obj): SeoContent {
  const seo: SeoContent = {};
  for (const key of SEO_KEYS) {
    const entry = asObj(raw?.[key]);
    if (!entry) continue;
    const socialImage = asObj(entry.socialImage) as RawImage;
    const resolved: SeoEntry = {
      title: optionalText(entry.title),
      description: optionalText(entry.description),
      socialTitle: optionalText(entry.socialTitle),
      socialDescription: optionalText(entry.socialDescription),
      socialImage: socialImage?.resolvedSrc || (socialImage?.fallbackSrc?.startsWith("/") ? socialImage.fallbackSrc : undefined) || undefined
    };
    if (Object.values(resolved).some(Boolean)) seo[key] = resolved;
  }
  return seo;
}

/* ---------------------------------------------------------------- about */

/** An optional image: present only when the editor has set a usable one. */
function optionalImage(value: unknown, fallbackAlt: string): CmsImage | undefined {
  const resolved = image(value, { src: "", alt: fallbackAlt });
  return resolved.src ? resolved : undefined;
}

export function resolveAbout(raw: Obj): AboutContent {
  const fb = fallbackAbout;
  const hero = asObj(raw?.hero);
  const story = asObj(raw?.story);
  const statement = asObj(raw?.statement);
  const why = asObj(raw?.why);
  const team = asObj(raw?.team);
  const approach = asObj(raw?.approach);
  const goals = asObj(raw?.goals);
  const closing = asObj(raw?.closing);
  const withImage = <T extends object>(base: T, value: CmsImage | undefined) => (value ? { ...base, image: value } : base);

  return {
    hero: withImage(
      { eyebrow: text(hero?.eyebrow, fb.hero.eyebrow), heading: heading(hero, fb.hero.heading), paragraphs: textList(hero?.paragraphs, fb.hero.paragraphs), ctaLabel: text(hero?.ctaLabel, fb.hero.ctaLabel) },
      optionalImage(hero?.image, "")
    ),
    story: withImage(
      {
        eyebrow: text(story?.eyebrow, fb.story.eyebrow),
        heading: heading(story, fb.story.heading),
        beats: resolveItems(story?.beats, (beat) => {
          const label = optionalText(beat?.label);
          const body = optionalText(beat?.body);
          return label && body ? { label, body } : null;
        }, fb.story.beats)
      },
      optionalImage(story?.image, "")
    ),
    statement: heading(statement, fb.statement),
    why: {
      eyebrow: text(why?.eyebrow, fb.why.eyebrow),
      heading: heading(why, fb.why.heading),
      refusals: textList(why?.refusals, fb.why.refusals),
      promise: text(why?.promise, fb.why.promise),
      hope: text(why?.hope, fb.why.hope)
    },
    team: {
      eyebrow: text(team?.eyebrow, fb.team.eyebrow),
      heading: heading(team, fb.team.heading),
      intro: text(team?.intro, fb.team.intro),
      trust: textList(team?.trust, fb.team.trust),
      founders: resolveItems(team?.founders, (founder) => {
        const name = optionalText(founder?.name);
        const bio = optionalText(founder?.bio);
        if (!name || !bio) return null;
        const photo = optionalImage(founder?.photo, name);
        return { name, role: text(founder?.role, ""), bio, credentials: textList(founder?.credentials, []), ...(photo ? { photo } : {}) };
      }, fb.team.founders)
    },
    approach: withImage(
      {
        eyebrow: text(approach?.eyebrow, fb.approach.eyebrow),
        heading: heading(approach, fb.approach.heading),
        paragraphs: textList(approach?.paragraphs, fb.approach.paragraphs),
        routineLabel: text(approach?.routineLabel, fb.approach.routineLabel),
        routine: textList(approach?.routine, fb.approach.routine)
      },
      optionalImage(approach?.image, "")
    ),
    goals: {
      eyebrow: text(goals?.eyebrow, fb.goals.eyebrow),
      heading: heading(goals, fb.goals.heading),
      intro: text(goals?.intro, fb.goals.intro),
      items: resolveItems(goals?.items, (item) => {
        const label = optionalText(item?.label);
        const body = optionalText(item?.body);
        return label && body ? { label, body } : null;
      }, fb.goals.items)
    },
    closing: withImage(
      { heading: heading(closing, fb.closing.heading), body: text(closing?.body, fb.closing.body), ctaLabel: text(closing?.ctaLabel, fb.closing.ctaLabel) },
      optionalImage(closing?.image, "")
    )
  };
}

/* ------------------------------------------------------------------ all */

export function resolvePublicSite(payload: RawPayload): PublicSiteContent {
  const settings = resolveSettings(asObj(payload?.siteSettings));
  const packages = resolvePackages(payload?.packages, asObj(payload?.packagesPage));
  return {
    settings,
    home: resolveHome(payload, packages),
    packages,
    packagesPage: resolvePackagesPage(asObj(payload?.packagesPage), packages),
    contactPage: resolveContactPage(asObj(payload?.siteSettings)),
    about: resolveAbout(asObj(payload?.aboutPage)),
    seo: resolveSeo(asObj(payload?.seo))
  };
}
