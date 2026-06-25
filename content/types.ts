export type LanguageCode = "EN" | "HI";

export interface NavLinkContent {
  label: string;
  href: string;
}

export interface NavContent {
  links: NavLinkContent[];
  locationLabel: string;
  locationValue: string;
  searchPlaceholder: string;
}

export interface BrandContent {
  name: string;
  tagline: string;
  serviceLine: string;
  trustBadges: string[];
  phoneDisplay: string;
  phoneTel: string;
  whatsappLabel: string;
  whatsappUrl: string;
  headerStats: HeaderStatContent[];
}

export interface HeaderStatContent {
  label: string;
  value: string;
}

export interface TrustStat {
  value: string;
  label: string;
}

export interface VisualAsset {
  src?: string;
  srcSet?: string;
  width?: number;
  height?: number;
  alt?: string;
  label?: string;
  objectPosition?: string;
  placeholderCode?: string;
}

export interface HeroTrustModule {
  title: string;
  otpBadge: string;
  doctorQuote: string;
  doctorByline: string;
  stats: TrustStat[];
}

export interface HeroVisualContent {
  image: string;
  alt: string;
  beforeImage?: string;
  afterImage?: string;
  beforeImageMobile?: string;
  beforeImageDesktop?: string;
  afterImageMobile?: string;
  afterImageDesktop?: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeLabel?: string;
  afterLabel?: string;
  autoplayMs?: number;
  videoSrc?: string;
  videoPoster?: string;
  videoTitle?: string;
  badge: string;
  caption: string;
}

export interface HeroContent {
  eyebrow: string;
  heading: string;
  subcopy: string;
  primaryCta: string;
  secondaryCta: string;
  supportNote: string;
  supportPoints?: string[];
  trustModule: HeroTrustModule;
  visual: HeroVisualContent;
}

export type ProcessStepBadge = "MANDATORY" | "INCLUDED" | "ADD_ON";

export interface ProcessStepContent {
  id: string;
  title: string;
  description: string;
  icon: string;
  alt: string;
  badge: ProcessStepBadge;
  visual?: VisualAsset;
}

export interface ProcessSectionContent extends SectionHeader {
  id: string;
  steps: ProcessStepContent[];
  highlights?: string[];
  addOnDisclosure: string;
  primaryCta: string;
  secondaryCta: string;
}

export interface WhatWeDoSectionContent {
  eyebrow: string;
  title: string;
  description: string;
  valueTags: string[];
  visual?: VisualAsset;
}

export interface RiskQuizAnswerOption {
  id: string;
  label: string;
  score: number;
}

export interface RiskQuizQuestionContent {
  id: string;
  prompt: string;
  options: RiskQuizAnswerOption[];
}

export interface RiskQuizBand {
  id: string;
  min: number;
  max: number;
  label: string;
  summary: string;
  recommendedPlan: PackagePlanContent["name"];
}

export interface RiskQuizSectionContent extends SectionHeader {
  id: string;
  intro: string;
  questions: RiskQuizQuestionContent[];
  bands: RiskQuizBand[];
  resultCtaLabel: string;
  restartLabel: string;
  startLabel: string;
}

export interface PackageFeatureItem {
  id: string;
  label: string;
  description?: string;
  benefits?: string[];
}

export type PackagePlanName = "Basic" | "Standard" | "Advanced" | "Pro" | "Essential" | "Comfort";

export interface PackageAddOnContent {
  title: string;
  description: string;
}

export interface PackagePlanContent {
  id: string;
  name: PackagePlanName;
  price: string;
  savings: string;
  bestFor?: string;
  outcome?: string;
  summary?: string;
  badge?: string;
  titleDescriptor?: string;
  isFeatured?: boolean;
  visual?: VisualAsset;
  visualHighlights?: string[];
  includedFeatureIds: string[];
  availableAddOnIds?: string[];
  ctaLabel: string;
}

export interface ProblemStatContent {
  icon: string;
  title: string;
  description: string;
  visual?: VisualAsset;
}

export interface EvidenceSnapshotCardContent {
  id: string;
  kicker?: string;
  value: string;
  label: string;
  context: string;
  sourceLabel: string;
  sourceId: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface EvidenceSectionContent extends SectionHeader {
  id: string;
  cards: EvidenceSnapshotCardContent[];
}

export interface ProblemSectionContent extends SectionHeader {
  id: string;
  lead: string;
  stats: ProblemStatContent[];
  conclusion: string;
  highlights?: string[];
}

export interface TransformationSectionContent extends SectionHeader {
  id: string;
  beforeTitle: string;
  beforePoints: string[];
  afterTitle: string;
  afterPoints: string[];
  installLine: string;
}

export interface BeforeAfterGalleryItemContent {
  id: string;
  title: string;
  caption: string;
  before: VisualAsset;
  after: VisualAsset;
  tags?: string[];
}

export interface ExplainerVideoContent {
  title: string;
  caption: string;
  poster: string;
  posterAlt: string;
  embedUrl: string;
  externalUrl: string;
  durationLabel: string;
}

export interface TransformationGallerySectionContent extends SectionHeader {
  id: string;
  items: BeforeAfterGalleryItemContent[];
  explainer?: ExplainerVideoContent;
}

export interface ProductShowcaseItemContent {
  id: string;
  title: string;
  caption: string;
  visual?: VisualAsset;
}

export interface ProductShowcaseSectionContent extends SectionHeader {
  id: string;
  items: ProductShowcaseItemContent[];
}

export interface WhoForSectionContent extends SectionHeader {
  id: string;
  items: string[];
}

export interface InstallationTrustSectionContent extends SectionHeader {
  id: string;
  items: string[];
}

export interface FaqItemContent {
  question: string;
  answer: string;
}

export interface FaqSectionContent extends SectionHeader {
  id: string;
  items: FaqItemContent[];
}

export interface FinalCtaSectionContent {
  id: string;
  title: string;
  subtitle: string;
  primaryCta: string;
  secondaryLabel: string;
}

export interface ServiceCategoryContent {
  id: string;
  title: string;
  icon: string;
  badge?: string;
}

export interface FeaturedServiceContent {
  id: string;
  title: string;
  rating: string;
  reviews: string;
  price: string;
  originalPrice?: string;
  city: string;
  tag?: string;
}

export interface WhyFeatureContent {
  title: string;
  description: string;
}

export interface TestimonialContent {
  id: string;
  quote: string;
  author: string;
  relation: string;
  city: string;
  photo?: VisualAsset;
  outcomeLine?: string;
}

export interface DoctorAttestationContent {
  id: string;
  quote: string;
  doctorName: string;
  specialty: string;
  registration: string;
  city: string;
  photo?: VisualAsset;
}

export interface SectionHeader {
  title: string;
  subtitle: string;
}

export interface HomepageContent {
  language: LanguageCode;
  nav: NavContent;
  brand: BrandContent;
  hero: HeroContent;
  whatWeDoSection: WhatWeDoSectionContent;
  transformationGallerySection: TransformationGallerySectionContent;
  problemSection: ProblemSectionContent;
  evidenceSection: EvidenceSectionContent;
  riskQuizSection: RiskQuizSectionContent;
  transformationSection: TransformationSectionContent;
  processSection: ProcessSectionContent;
  categoriesSection: SectionHeader & {
    items: ServiceCategoryContent[];
    emptyMessage: string;
  };
  featuredSection: SectionHeader & {
    items: FeaturedServiceContent[];
    emptyMessage: string;
  };
  packagesSection: SectionHeader & {
    features: PackageFeatureItem[];
    addOnFeatures?: PackageFeatureItem[];
    plans: PackagePlanContent[];
  };
  whySection: SectionHeader & {
    items: WhyFeatureContent[];
  };
  testimonialsSection: SectionHeader & {
    items: TestimonialContent[];
    emptyMessage: string;
  };
  doctorsSection: SectionHeader & {
    items: DoctorAttestationContent[];
    emptyMessage: string;
  };
  whoForSection: WhoForSectionContent;
  installationTrustSection: InstallationTrustSectionContent;
  productShowcaseSection: ProductShowcaseSectionContent;
  faqSection: FaqSectionContent;
  finalCtaSection: FinalCtaSectionContent;
}
