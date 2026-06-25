import { draftMode } from "next/headers";
import { homepageContent } from "../content/homepage.content";
import { comparePackagesContent } from "../content/compare-packages.content";
import { packageCatalog, type PackageCatalogEntry } from "../content/package-catalog";
import type {
  BeforeAfterGalleryItemContent,
  DoctorAttestationContent,
  HomepageContent,
  PackageFeatureItem,
  PackagePlanContent,
  TestimonialContent,
  VisualAsset,
  WhatWeDoSectionContent
} from "../content/types";
import { createSanityClient } from "../sanity/lib/client";
import { urlForImage } from "../sanity/lib/image";
import { siteContentQuery } from "../sanity/lib/queries";
import { hasSanityConfig } from "../sanity/env";

type SiteContentFetchOptions = {
  preview?: "draft";
  token?: string;
  strict?: boolean;
};

type SanityImageValue = {
  assetRef?: string | null;
  url?: string | null;
  fallbackSrc?: string | null;
  alt?: string | null;
  label?: string | null;
  objectPosition?: string | null;
  crop?: { top: number; bottom: number; left: number; right: number } | null;
  hotspot?: { x: number; y: number; height: number; width: number } | null;
  dimensions?: { width?: number | null; height?: number | null; aspectRatio?: number | null } | null;
};

type ImageTransformSpec = {
  width: number;
  height: number;
  responsiveWidths: readonly number[];
};

const imageTransformSpecs = {
  hero: { width: 1200, height: 900, responsiveWidths: [640, 960, 1200] },
  landscape: { width: 1200, height: 900, responsiveWidths: [480, 800, 1200] },
  package: { width: 1200, height: 960, responsiveWidths: [480, 800, 1200] },
  portrait: { width: 800, height: 1000, responsiveWidths: [320, 560, 800] }
} as const satisfies Record<string, ImageTransformSpec>;

type SanityFeature = {
  key?: string | null;
  label?: string | null;
  description?: string | null;
  benefits?: string[] | null;
  sortOrder?: number | null;
};

type SanityPackage = {
  _id?: string;
  code?: string | null;
  name?: string | null;
  badge?: string | null;
  titleDescriptor?: string | null;
  bestFor?: string | null;
  outcome?: string | null;
  summary?: string | null;
  ctaLabel?: string | null;
  priceLabel?: string | null;
  savings?: string | null;
  isFeatured?: boolean | null;
  visual?: SanityImageValue | null;
  visualHighlights?: string[] | null;
  includedFeatures?: SanityFeature[] | null;
  availableAddOns?: SanityFeature[] | null;
  sortOrder?: number | null;
};

type SanityTestimonial = {
  _id?: string;
  name?: string | null;
  relation?: string | null;
  city?: string | null;
  quote?: string | null;
  outcomeLine?: string | null;
  photo?: SanityImageValue | null;
};

type SanityDoctor = {
  _id?: string;
  name?: string | null;
  specialty?: string | null;
  registration?: string | null;
  quote?: string | null;
  photo?: SanityImageValue | null;
};

type SanityGalleryItem = {
  _id?: string;
  title?: string | null;
  caption?: string | null;
  beforeImage?: SanityImageValue | null;
  afterImage?: SanityImageValue | null;
  tags?: string[] | null;
};

type SanityRiskQuiz = {
  title?: string | null;
  subtitle?: string | null;
  intro?: string | null;
  questions?: Array<{
    id?: string | null;
    prompt?: string | null;
    options?: Array<{ id?: string | null; label?: string | null }> | null;
  }> | null;
  startLabel?: string | null;
  resultCtaLabel?: string | null;
  restartLabel?: string | null;
};

type SanitySiteSettings = {
  brandName?: string | null;
  serviceLine?: string | null;
  phoneDisplay?: string | null;
  phoneTel?: string | null;
  whatsappLabel?: string | null;
  whatsappUrl?: string | null;
  trustBadges?: string[] | null;
  refundLanguage?: string | null;
  doctorDisclaimer?: string | null;
};

type SanityHomepage = Omit<Partial<HomepageContent>, "hero" | "whatWeDoSection"> & {
  hero?: Omit<Partial<HomepageContent["hero"]>, "visual"> & {
    beforeVisual?: SanityImageValue | null;
    afterVisual?: SanityImageValue | null;
    visual?: SanityImageValue | null;
  };
  whatWeDoSection?: Omit<Partial<WhatWeDoSectionContent>, "visual"> & { visual?: SanityImageValue | null };
};

type SanitySitePayload = {
  homepage?: SanityHomepage | null;
  siteSettings?: SanitySiteSettings | null;
  riskQuiz?: SanityRiskQuiz | null;
  packages?: SanityPackage[] | null;
  packageFeatures?: SanityFeature[] | null;
  testimonials?: SanityTestimonial[] | null;
  doctors?: SanityDoctor[] | null;
  gallery?: SanityGalleryItem[] | null;
};

function transformedSanityImageUrl(image: SanityImageValue, width: number, height: number) {
  if (!image.assetRef) return undefined;
  return urlForImage({
    asset: { _ref: image.assetRef },
    ...(image.crop ? { crop: image.crop } : {}),
    ...(image.hotspot ? { hotspot: image.hotspot } : {})
  })
    .width(width)
    .height(height)
    .fit("crop")
    .auto("format")
    .quality(85)
    .url();
}

function toVisualAsset(
  image: SanityImageValue | null | undefined,
  fallbackAlt: string,
  spec: ImageTransformSpec = imageTransformSpecs.landscape
): VisualAsset | undefined {
  const transformedSrc = image?.assetRef ? transformedSanityImageUrl(image, spec.width, spec.height) : undefined;
  const src = transformedSrc || image?.url || image?.fallbackSrc;
  if (!src) {
    return undefined;
  }

  const srcSet = image?.assetRef
    ? spec.responsiveWidths
        .map((width) => {
          const height = Math.round((width * spec.height) / spec.width);
          return `${transformedSanityImageUrl(image, width, height)} ${width}w`;
        })
        .join(", ")
    : undefined;

  return {
    src,
    srcSet,
    width: spec.width,
    height: spec.height,
    alt: image?.alt || fallbackAlt,
    label: image?.label || undefined,
    objectPosition: image?.objectPosition || undefined
  };
}

function toFeature(item: SanityFeature | null | undefined): PackageFeatureItem | null {
  if (!item?.key || !item.label) {
    return null;
  }

  return {
    id: item.key,
    label: item.label,
    description: item.description || undefined,
    benefits: Array.isArray(item.benefits) ? item.benefits.filter((benefit): benefit is string => Boolean(benefit)) : undefined
  };
}

function uniqueFeatures(items: PackageFeatureItem[]) {
  const map = new Map<string, PackageFeatureItem>();
  for (const item of items) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function applySanityHomepage(base: HomepageContent, homepage: SanityHomepage | null | undefined, settings: SanitySiteSettings | null | undefined) {
  const next: HomepageContent = structuredClone(base);

  if (settings) {
    next.brand = {
      ...next.brand,
      name: settings.brandName || next.brand.name,
      serviceLine: settings.serviceLine || next.brand.serviceLine,
      phoneDisplay: settings.phoneDisplay || next.brand.phoneDisplay,
      phoneTel: settings.phoneTel || next.brand.phoneTel,
      whatsappLabel: settings.whatsappLabel || next.brand.whatsappLabel,
      whatsappUrl: settings.whatsappUrl || next.brand.whatsappUrl,
      trustBadges: settings.trustBadges?.length ? settings.trustBadges : next.brand.trustBadges
    };
  }

  if (!homepage) {
    return next;
  }

  if (homepage.hero) {
    const { beforeVisual, afterVisual, visual, ...heroFields } = homepage.hero;
    const legacyHeroVisual = toVisualAsset(visual, next.hero.visual.alt, imageTransformSpecs.hero);
    const heroBeforeVisual = toVisualAsset(
      beforeVisual,
      next.hero.visual.beforeAlt || `${next.hero.visual.alt} before`,
      imageTransformSpecs.hero
    );
    const heroAfterVisual = toVisualAsset(
      afterVisual,
      next.hero.visual.afterAlt || `${next.hero.visual.alt} after`,
      imageTransformSpecs.hero
    );
    next.hero = {
      ...next.hero,
      ...heroFields,
      visual: {
        ...next.hero.visual,
        image: heroAfterVisual?.src || legacyHeroVisual?.src || next.hero.visual.image,
        alt: heroAfterVisual?.alt || legacyHeroVisual?.alt || next.hero.visual.alt,
        beforeImage: heroBeforeVisual?.src || next.hero.visual.beforeImage,
        beforeImageMobile: heroBeforeVisual?.srcSet || heroBeforeVisual?.src || next.hero.visual.beforeImageMobile,
        beforeImageDesktop: heroBeforeVisual?.srcSet || heroBeforeVisual?.src || next.hero.visual.beforeImageDesktop,
        afterImage: heroAfterVisual?.src || next.hero.visual.afterImage,
        afterImageMobile: heroAfterVisual?.srcSet || heroAfterVisual?.src || next.hero.visual.afterImageMobile,
        afterImageDesktop: heroAfterVisual?.srcSet || heroAfterVisual?.src || next.hero.visual.afterImageDesktop,
        beforeAlt: heroBeforeVisual?.alt || next.hero.visual.beforeAlt,
        afterAlt: heroAfterVisual?.alt || next.hero.visual.afterAlt
      }
    };
  }

  if (homepage.whatWeDoSection) {
    const { visual, ...whatWeDoFields } = homepage.whatWeDoSection;
    const whatWeDoVisual = toVisualAsset(
      visual,
      next.whatWeDoSection.visual?.alt || "What we do bathroom visual",
      imageTransformSpecs.landscape
    );
    next.whatWeDoSection = {
      ...next.whatWeDoSection,
      ...whatWeDoFields,
      visual: whatWeDoVisual || next.whatWeDoSection.visual
    };
  }

  const sectionKeys = [
    "transformationGallerySection",
    "problemSection",
    "evidenceSection",
    "packagesSection",
    "whySection",
    "processSection",
    "doctorsSection",
    "testimonialsSection",
    "faqSection",
    "finalCtaSection"
  ] as const;

  for (const key of sectionKeys) {
    if (homepage[key]) {
      next[key] = {
        ...next[key],
        ...((homepage[key] as unknown) as Record<string, unknown>)
      } as never;
    }
  }

  return next;
}

function applySanityPackages(content: HomepageContent, packages: SanityPackage[] | null | undefined, allFeatures: SanityFeature[] | null | undefined) {
  const lockedPackages = (packages || [])
    .filter((pkg) => pkg.code === "package-standard" || pkg.code === "package-advanced")
    .filter((pkg) => pkg.name === "Standard" || pkg.name === "Advanced")
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));

  if (!lockedPackages.length) {
    return content;
  }

  const baseFeatures = (allFeatures || []).map(toFeature).filter((item): item is PackageFeatureItem => Boolean(item));
  const planFeatures = lockedPackages.flatMap((pkg) => (pkg.includedFeatures || []).map(toFeature).filter((item): item is PackageFeatureItem => Boolean(item)));
  const addOnFeatures = lockedPackages.flatMap((pkg) => (pkg.availableAddOns || []).map(toFeature).filter((item): item is PackageFeatureItem => Boolean(item)));

  const plans: PackagePlanContent[] = lockedPackages.map((pkg, index) => {
    const included = (pkg.includedFeatures || []).map(toFeature).filter((item): item is PackageFeatureItem => Boolean(item));
    const addOns = (pkg.availableAddOns || []).map(toFeature).filter((item): item is PackageFeatureItem => Boolean(item));
    const fallbackPlan = content.packagesSection.plans.find((plan) => plan.id === pkg.code);

    return {
      id: pkg.code!,
      name: pkg.name as PackagePlanContent["name"],
      price: pkg.priceLabel || fallbackPlan?.price || pkg.name!,
      savings: pkg.savings || fallbackPlan?.savings || (index === 0 ? "Core package" : "Premium package"),
      bestFor: pkg.bestFor || fallbackPlan?.bestFor,
      outcome: pkg.outcome || fallbackPlan?.outcome,
      summary: pkg.summary || fallbackPlan?.summary,
      badge: pkg.badge || fallbackPlan?.badge,
      titleDescriptor: pkg.titleDescriptor || fallbackPlan?.titleDescriptor,
      isFeatured: pkg.isFeatured ?? fallbackPlan?.isFeatured ?? index === 1,
      visual: toVisualAsset(pkg.visual, pkg.name || "Package visual", imageTransformSpecs.package) || fallbackPlan?.visual,
      visualHighlights: pkg.visualHighlights?.length ? pkg.visualHighlights : fallbackPlan?.visualHighlights,
      includedFeatureIds: included.map((feature) => feature.id),
      availableAddOnIds: addOns.length ? addOns.map((feature) => feature.id) : fallbackPlan?.availableAddOnIds,
      ctaLabel: pkg.ctaLabel || fallbackPlan?.ctaLabel || `Book ${pkg.name}`
    };
  });

  return {
    ...content,
    packagesSection: {
      ...content.packagesSection,
      features: uniqueFeatures([...baseFeatures, ...planFeatures]),
      addOnFeatures: addOnFeatures.length ? uniqueFeatures(addOnFeatures) : content.packagesSection.addOnFeatures,
      plans
    }
  };
}

function applySanityTestimonials(content: HomepageContent, testimonials: SanityTestimonial[] | null | undefined) {
  if (!testimonials?.length) {
    return content;
  }

  const items: TestimonialContent[] = testimonials
    .filter((item) => item.name && item.quote)
    .map((item) => ({
      id: item._id || item.name!,
      quote: item.quote!,
      author: item.name!,
      relation: item.relation || "Customer",
      city: item.city || "",
      outcomeLine: item.outcomeLine || undefined,
      photo: toVisualAsset(item.photo, item.name!, imageTransformSpecs.portrait)
    }));

  return items.length
    ? {
        ...content,
        testimonialsSection: {
          ...content.testimonialsSection,
          items
        }
      }
    : content;
}

function applySanityDoctors(content: HomepageContent, doctors: SanityDoctor[] | null | undefined) {
  if (!doctors?.length) {
    return content;
  }

  const items: DoctorAttestationContent[] = doctors
    .filter((item) => item.name && item.specialty && item.registration && item.quote)
    .map((item) => ({
      id: item._id || item.name!,
      quote: item.quote!,
      doctorName: item.name!,
      specialty: item.specialty!,
      registration: item.registration!,
      city: "",
      photo: toVisualAsset(item.photo, item.name!, imageTransformSpecs.portrait)
    }));

  return items.length
    ? {
        ...content,
        doctorsSection: {
          ...content.doctorsSection,
          items
        }
      }
    : content;
}

function applySanityGallery(content: HomepageContent, gallery: SanityGalleryItem[] | null | undefined) {
  if (!gallery?.length) {
    return content;
  }

  const items: BeforeAfterGalleryItemContent[] = gallery
    .filter((item) => item.title && item.caption)
    .map((item) => ({
      id: item._id || item.title!,
      title: item.title!,
      caption: item.caption!,
      before: toVisualAsset(item.beforeImage, `${item.title} before`) || { alt: `${item.title} before` },
      after: toVisualAsset(item.afterImage, `${item.title} after`) || { alt: `${item.title} after` },
      tags: item.tags?.filter((tag): tag is string => Boolean(tag))
    }))
    .filter((item) => item.before.src && item.after.src);

  return items.length
    ? {
        ...content,
        transformationGallerySection: {
          ...content.transformationGallerySection,
          items
        }
      }
    : content;
}

function applySanityRiskQuiz(content: HomepageContent, riskQuiz: SanityRiskQuiz | null | undefined) {
  if (!riskQuiz) {
    return content;
  }

  const fallbackQuestions = content.riskQuizSection.questions;
  const questions = fallbackQuestions.map((question) => {
    const sanityQuestion = riskQuiz.questions?.find((item) => item.id === question.id);
    return {
      ...question,
      prompt: sanityQuestion?.prompt || question.prompt,
      options: question.options.map((option) => {
        const sanityOption = sanityQuestion?.options?.find((item) => item.id === option.id);
        return {
          ...option,
          label: sanityOption?.label || option.label
        };
      })
    };
  });

  return {
    ...content,
    riskQuizSection: {
      ...content.riskQuizSection,
      title: riskQuiz.title || content.riskQuizSection.title,
      subtitle: riskQuiz.subtitle || content.riskQuizSection.subtitle,
      intro: riskQuiz.intro || content.riskQuizSection.intro,
      questions,
      startLabel: riskQuiz.startLabel || content.riskQuizSection.startLabel,
      resultCtaLabel: riskQuiz.resultCtaLabel || content.riskQuizSection.resultCtaLabel,
      restartLabel: riskQuiz.restartLabel || content.riskQuizSection.restartLabel,
      bands: content.riskQuizSection.bands
    }
  };
}

function enforceAssessmentFirstLaunchFraming(content: HomepageContent, base: HomepageContent) {
  return {
    ...content,
    packagesSection: {
      ...content.packagesSection,
      title: base.packagesSection.title,
      subtitle: base.packagesSection.subtitle,
      plans: content.packagesSection.plans.map((plan) => ({
        ...plan,
        ctaLabel: `Continue with ${plan.name}`
      }))
    },
    riskQuizSection: {
      ...content.riskQuizSection,
      title: base.riskQuizSection.title,
      subtitle: base.riskQuizSection.subtitle,
      intro: base.riskQuizSection.intro,
      startLabel: base.riskQuizSection.startLabel,
      resultCtaLabel: base.riskQuizSection.resultCtaLabel,
      restartLabel: base.riskQuizSection.restartLabel
    },
    processSection: {
      ...content.processSection,
      title: base.processSection.title,
      subtitle: base.processSection.subtitle,
      highlights: base.processSection.highlights,
      addOnDisclosure: base.processSection.addOnDisclosure,
      primaryCta: base.processSection.primaryCta,
      secondaryCta: base.processSection.secondaryCta,
      steps: base.processSection.steps
    },
    finalCtaSection: {
      ...content.finalCtaSection,
      title: base.finalCtaSection.title,
      subtitle: base.finalCtaSection.subtitle,
      primaryCta: base.finalCtaSection.primaryCta,
      secondaryLabel: base.finalCtaSection.secondaryLabel
    }
  };
}

async function isDraftModeEnabled() {
  const store = await draftMode();
  return store.isEnabled;
}

async function fetchSanityContent(options: SiteContentFetchOptions = {}) {
  if (!hasSanityConfig()) {
    return null;
  }

  const preview = options.preview === "draft" && (await isDraftModeEnabled());
  const token = preview ? process.env.SANITY_API_READ_TOKEN : undefined;
  if (preview && !token) {
    if (options.strict) {
      throw new Error("SANITY_API_READ_TOKEN is required for draft preview.");
    }
    return null;
  }

  try {
    return await createSanityClient({ preview, token }).fetch<SanitySitePayload>(siteContentQuery);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return null;
  }
}

async function buildContent(base: HomepageContent, view: "homepage" | "compare-packages", options: SiteContentFetchOptions = {}) {
  const payload = await fetchSanityContent(options);
  if (!payload) {
    return base;
  }

  let content = applySanityHomepage(base, payload.homepage, payload.siteSettings);
  content = applySanityPackages(content, payload.packages, payload.packageFeatures);
  content = applySanityTestimonials(content, payload.testimonials);
  content = applySanityDoctors(content, payload.doctors);
  content = applySanityGallery(content, payload.gallery);
  content = applySanityRiskQuiz(content, payload.riskQuiz);

  if (view === "compare-packages") {
    content = {
      ...content,
      packagesSection: {
        ...content.packagesSection,
        title: payload.homepage?.packagesSection?.title || base.packagesSection.title,
        subtitle: payload.homepage?.packagesSection?.subtitle || base.packagesSection.subtitle,
        addOnFeatures: content.packagesSection.addOnFeatures ?? base.packagesSection.addOnFeatures
      }
    };
  }

  return enforceAssessmentFirstLaunchFraming(content, base);
}

export async function getHomepageContentData(options: SiteContentFetchOptions = {}) {
  return buildContent(homepageContent, "homepage", options);
}

export async function getComparePackagesContentData(options: SiteContentFetchOptions = {}) {
  return buildContent(comparePackagesContent, "compare-packages", options);
}

export async function getPackageCatalogEntryData(packageId?: string | null): Promise<PackageCatalogEntry | null> {
  const content = await getComparePackagesContentData();
  const section = content.packagesSection;
  const plan = section.plans.find((item) => item.id === packageId);
  if (!plan) {
    return packageCatalog.find((entry) => entry.plan.id === packageId) ?? null;
  }

  return {
    sectionTitle: section.title,
    sectionSubtitle: section.subtitle,
    plan,
    features: section.features,
    addOnFeatures: section.addOnFeatures ?? []
  };
}

export function getIncludedFeaturesFromEntry(entry: PackageCatalogEntry) {
  return entry.features.filter((feature) => entry.plan.includedFeatureIds.includes(feature.id));
}

export function getExcludedFeaturesFromEntry(entry: PackageCatalogEntry) {
  return entry.features.filter((feature) => !entry.plan.includedFeatureIds.includes(feature.id));
}

export function getAvailableAddOnsFromEntry(entry: PackageCatalogEntry) {
  if (!entry.plan.availableAddOnIds?.length) {
    return [];
  }
  return entry.addOnFeatures.filter((feature) => entry.plan.availableAddOnIds?.includes(feature.id));
}
