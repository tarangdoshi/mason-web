import { groq } from "next-sanity";

const imageProjection = `{
  alt,
  caption,
  fallbackSrc,
  label,
  objectPosition,
  crop,
  hotspot,
  "assetRef": asset._ref,
  "dimensions": asset->metadata.dimensions,
  "url": asset->url
}`;

export const siteContentQuery = groq`{
  "homepage": *[_type == "homepage"][0]{
    ...,
    hero{..., beforeVisual${imageProjection}, afterVisual${imageProjection}, visual${imageProjection}},
    whatWeDoSection{..., visual${imageProjection}},
    transformationGallerySection{..., explainer{..., poster${imageProjection}}},
    problemSection{..., stats[]{..., visual${imageProjection}}},
    processSection{..., steps[]{..., visual${imageProjection}}},
    packagesSection,
    whySection,
    testimonialsSection,
    doctorsSection,
    faqSection,
    finalCtaSection,
    evidenceSection,
    riskQuizSection
  },
  "siteSettings": *[_type == "siteSettings"][0],
  "riskQuiz": *[_type == "riskQuiz"][0],
  "packages": *[_type == "package"] | order(sortOrder asc){
    _id,
    code,
    name,
    badge,
    titleDescriptor,
    bestFor,
    outcome,
    summary,
    ctaLabel,
    priceLabel,
    savings,
    isFeatured,
    sortOrder,
    visual${imageProjection},
    visualHighlights,
    "includedFeatures": includedFeatures[]->{key, label, description, benefits, sortOrder},
    "availableAddOns": availableAddOns[]->{key, label, description, benefits, sortOrder}
  },
  "packageFeatures": *[_type == "packageFeature"] | order(sortOrder asc){key, label, description, benefits, sortOrder},
  "testimonials": *[_type == "testimonial"] | order(sortOrder asc){
    _id,
    name,
    relation,
    city,
    quote,
    outcomeLine,
    isFeatured,
    sortOrder,
    photo${imageProjection}
  },
  "doctors": *[_type == "doctor"] | order(sortOrder asc){
    _id,
    name,
    specialty,
    registration,
    experienceLabel,
    quote,
    isFeatured,
    sortOrder,
    photo${imageProjection}
  },
  "gallery": *[_type == "galleryItem"] | order(sortOrder asc){
    _id,
    title,
    caption,
    tags,
    sortOrder,
    beforeImage${imageProjection},
    afterImage${imageProjection}
  }
}`;
