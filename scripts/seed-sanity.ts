import { createClient } from "@sanity/client";
import { comparePackagesContent } from "../content/compare-packages.content";
import { homepageContent } from "../content/homepage.content";
import type { VisualAsset } from "../content/types";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../sanity/env";

const doctorDisclaimer =
  "Doctor inputs are used for preventive safety planning and product approach. Mason Company does not provide medical treatment or guarantee fall-free outcomes.";
const refundLanguage = "If you cancel before the technician arrives or starts implementation, you are eligible for a full refund.";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

const client = createClient({
  projectId: sanityProjectId || requiredEnv("NEXT_PUBLIC_SANITY_PROJECT_ID"),
  dataset: sanityDataset || requiredEnv("NEXT_PUBLIC_SANITY_DATASET"),
  apiVersion: sanityApiVersion,
  token: requiredEnv("SANITY_API_WRITE_TOKEN"),
  useCdn: false
});

function imageFromVisual(visual: VisualAsset | undefined, fallbackAlt: string) {
  if (!visual?.src) {
    return undefined;
  }

  return {
    _type: "image",
    fallbackSrc: visual.src,
    alt: visual.alt || fallbackAlt,
    label: visual.label,
    objectPosition: visual.objectPosition
  };
}

function reference(id: string) {
  return { _key: id, _type: "reference", _ref: id };
}

function featureDocId(key: string) {
  return `packageFeature-${key}`;
}

async function seed() {
  const featureDocs = homepageContent.packagesSection.features.map((feature, index) => ({
    _id: featureDocId(feature.id),
    _type: "packageFeature",
    key: feature.id,
    label: feature.label,
    description: feature.description,
    benefits: feature.benefits,
    sortOrder: index
  }));

  const addOnFeatureDocs = (comparePackagesContent.packagesSection.addOnFeatures || []).map((feature, index) => ({
    _id: featureDocId(feature.id),
    _type: "packageFeature",
    key: feature.id,
    label: feature.label,
    description: feature.description,
    benefits: feature.benefits,
    sortOrder: featureDocs.length + index
  }));

  for (const doc of [...featureDocs, ...addOnFeatureDocs]) {
    await client.createOrReplace(doc);
  }

  for (const [index, plan] of homepageContent.packagesSection.plans.entries()) {
    await client.createOrReplace({
      _id: `package-${plan.id}`,
      _type: "package",
      code: plan.id,
      name: plan.name,
      badge: plan.badge,
      titleDescriptor: plan.titleDescriptor,
      bestFor: plan.bestFor,
      outcome: plan.outcome,
      summary: plan.summary,
      ctaLabel: plan.ctaLabel,
      priceLabel: plan.price,
      savings: plan.savings,
      isFeatured: Boolean(plan.isFeatured),
      sortOrder: index,
      visual: imageFromVisual(plan.visual, `${plan.name} package visual`),
      visualHighlights: plan.visualHighlights,
      includedFeatures: plan.includedFeatureIds.map((id) => reference(featureDocId(id))),
      availableAddOns: (plan.availableAddOnIds || []).map((id) => reference(featureDocId(id)))
    });
  }

  await client.createOrReplace({
    _id: "homepage",
    _type: "homepage",
    hero: {
      eyebrow: homepageContent.hero.eyebrow,
      heading: homepageContent.hero.heading,
      subcopy: homepageContent.hero.subcopy,
      primaryCta: homepageContent.hero.primaryCta,
      secondaryCta: homepageContent.hero.secondaryCta,
      supportPoints: homepageContent.hero.supportPoints,
      beforeVisual: imageFromVisual(
        {
          src: homepageContent.hero.visual.beforeImageDesktop || homepageContent.hero.visual.beforeImage,
          alt: homepageContent.hero.visual.beforeAlt
        },
        `${homepageContent.hero.visual.alt} before`
      ),
      afterVisual: imageFromVisual(
        {
          src: homepageContent.hero.visual.afterImageDesktop || homepageContent.hero.visual.afterImage,
          alt: homepageContent.hero.visual.afterAlt
        },
        `${homepageContent.hero.visual.alt} after`
      ),
      visual: imageFromVisual(
        { src: homepageContent.hero.visual.image, alt: homepageContent.hero.visual.alt },
        homepageContent.hero.visual.alt
      )
    },
    whatWeDoSection: {
      eyebrow: homepageContent.whatWeDoSection.eyebrow,
      title: homepageContent.whatWeDoSection.title,
      description: homepageContent.whatWeDoSection.description,
      valueTags: homepageContent.whatWeDoSection.valueTags,
      visual: imageFromVisual(
        homepageContent.whatWeDoSection.visual,
        homepageContent.whatWeDoSection.visual?.alt || "What we do bathroom visual"
      )
    },
    transformationGallerySection: {
      title: homepageContent.transformationGallerySection.title,
      subtitle: homepageContent.transformationGallerySection.subtitle
    },
    problemSection: {
      title: homepageContent.problemSection.title,
      subtitle: homepageContent.problemSection.subtitle,
      lead: homepageContent.problemSection.lead,
      highlights: homepageContent.problemSection.highlights
    },
    evidenceSection: {
      title: homepageContent.evidenceSection.title,
      subtitle: homepageContent.evidenceSection.subtitle,
      cards: homepageContent.evidenceSection.cards.map((card) => ({ ...card, _key: card.id }))
    },
    packagesSection: {
      title: homepageContent.packagesSection.title,
      subtitle: homepageContent.packagesSection.subtitle
    },
    whySection: {
      title: homepageContent.whySection.title,
      subtitle: homepageContent.whySection.subtitle,
      items: homepageContent.whySection.items.map((item, index) => ({ ...item, _key: `why-${index + 1}` }))
    },
    processSection: {
      title: homepageContent.processSection.title,
      subtitle: homepageContent.processSection.subtitle,
      highlights: homepageContent.processSection.highlights,
      addOnDisclosure: homepageContent.processSection.addOnDisclosure,
      primaryCta: homepageContent.processSection.primaryCta,
      secondaryCta: homepageContent.processSection.secondaryCta,
      steps: homepageContent.processSection.steps.map((step) => ({
        _key: step.id,
        id: step.id,
        title: step.title,
        description: step.description,
        badge: step.badge,
        visual: imageFromVisual(step.visual, step.alt)
      }))
    },
    doctorsSection: {
      title: homepageContent.doctorsSection.title,
      subtitle: homepageContent.doctorsSection.subtitle
    },
    testimonialsSection: {
      title: homepageContent.testimonialsSection.title,
      subtitle: homepageContent.testimonialsSection.subtitle
    },
    faqSection: {
      title: homepageContent.faqSection.title,
      subtitle: homepageContent.faqSection.subtitle,
      items: homepageContent.faqSection.items.map((item, index) => ({ ...item, _key: `faq-${index + 1}` }))
    },
    finalCtaSection: {
      title: homepageContent.finalCtaSection.title,
      subtitle: homepageContent.finalCtaSection.subtitle,
      primaryCta: homepageContent.finalCtaSection.primaryCta,
      secondaryLabel: homepageContent.finalCtaSection.secondaryLabel
    }
  });

  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    brandName: homepageContent.brand.name,
    serviceLine: homepageContent.brand.serviceLine,
    phoneDisplay: homepageContent.brand.phoneDisplay,
    phoneTel: homepageContent.brand.phoneTel,
    whatsappLabel: homepageContent.brand.whatsappLabel,
    whatsappUrl: homepageContent.brand.whatsappUrl,
    trustBadges: homepageContent.brand.trustBadges,
    homepageSeo: {
      title: "Mason Company | Bathroom Safety Upgrades for Ageing Parents",
      description: "Mason Company delivers premium bathroom safety upgrades with a warm, practical approach for modern families in Mumbai and Goa.",
      image: imageFromVisual(
        { src: homepageContent.hero.visual.afterImageDesktop || homepageContent.hero.visual.image, alt: homepageContent.hero.visual.afterAlt || homepageContent.hero.visual.alt },
        "Mason Company bathroom safety upgrade"
      )
    },
    comparePackagesSeo: {
      title: "Mason Company | Compare Retrofit Packages",
      description: "Compare the Mason Company Standard and Advanced retrofit washroom packages with a quiz-first package selection flow.",
      image: imageFromVisual(
        { src: homepageContent.hero.visual.afterImageDesktop || homepageContent.hero.visual.image, alt: homepageContent.hero.visual.afterAlt || homepageContent.hero.visual.alt },
        "Mason Company bathroom safety package comparison"
      )
    },
    refundLanguage,
    doctorDisclaimer
  });

  await client.createOrReplace({
    _id: "riskQuiz",
    _type: "riskQuiz",
    title: homepageContent.riskQuizSection.title,
    subtitle: homepageContent.riskQuizSection.subtitle,
    intro: homepageContent.riskQuizSection.intro,
    questions: homepageContent.riskQuizSection.questions.map((question) => ({
      _key: question.id,
      id: question.id,
      prompt: question.prompt,
      options: question.options.map((option) => ({ _key: option.id, id: option.id, label: option.label }))
    })),
    startLabel: homepageContent.riskQuizSection.startLabel,
    resultCtaLabel: homepageContent.riskQuizSection.resultCtaLabel,
    restartLabel: homepageContent.riskQuizSection.restartLabel
  });

  for (const [index, item] of homepageContent.testimonialsSection.items.entries()) {
    await client.createOrReplace({
      _id: `testimonial-${item.id}`,
      _type: "testimonial",
      name: item.author,
      relation: item.relation,
      city: item.city,
      quote: item.quote,
      outcomeLine: item.outcomeLine,
      photo: imageFromVisual(item.photo, item.author),
      isFeatured: index < 2,
      sortOrder: index
    });
  }

  for (const [index, item] of homepageContent.doctorsSection.items.entries()) {
    await client.createOrReplace({
      _id: `doctor-${item.id}`,
      _type: "doctor",
      name: item.doctorName,
      specialty: item.specialty,
      registration: item.registration,
      quote: item.quote,
      photo: imageFromVisual(item.photo, item.doctorName),
      isFeatured: true,
      sortOrder: index
    });
  }

  for (const [index, item] of homepageContent.transformationGallerySection.items.entries()) {
    await client.createOrReplace({
      _id: `galleryItem-${item.id}`,
      _type: "galleryItem",
      title: item.title,
      caption: item.caption,
      beforeImage: imageFromVisual(item.before, `${item.title} before`),
      afterImage: imageFromVisual(item.after, `${item.title} after`),
      tags: item.tags,
      sortOrder: index
    });
  }

  console.log("Seeded Mason Company Sanity content.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
