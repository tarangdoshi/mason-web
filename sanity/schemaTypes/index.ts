import { doctor } from "./doctor";
import { galleryItem } from "./galleryItem";
import { homepage } from "./homepage";
import { packageSchema } from "./package";
import { packageFeature } from "./packageFeature";
import { riskQuiz } from "./riskQuiz";
import { siteSettings } from "./siteSettings";
import { testimonial } from "./testimonial";
import { ctaFields, evidenceCard, faqItem, imageWithAlt, processStep, sectionHeader, seoFields } from "./objects";

export const schemaTypes = [
  imageWithAlt,
  sectionHeader,
  ctaFields,
  faqItem,
  processStep,
  evidenceCard,
  seoFields,
  homepage,
  packageSchema,
  packageFeature,
  testimonial,
  doctor,
  galleryItem,
  siteSettings,
  riskQuiz
];
