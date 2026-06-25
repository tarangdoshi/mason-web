import { comparePackagesContent } from "../../../../content/compare-packages.content";
import { homepageContent } from "../../../../content/homepage.content";

export const contentModuleKeys = ["packages", "testimonials", "doctors", "gallery", "homepage", "media"] as const;

export type ContentModuleKey = (typeof contentModuleKeys)[number];
export type ModerationStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "PENDING_REVIEW";
export type CityValue = "Mumbai" | "Goa";
export type LanguageValue = "EN" | "HI";

export type MediaItem = {
  id: string;
  storageKey: string;
  url: string;
  altText: string | null;
  mimeType: string;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt?: string;
};

export type PackageFeatureItem = {
  id?: string;
  featureKey: string;
  label: string;
  description?: string | null;
  benefitsJson?: unknown;
  sortOrder: number;
};

export type PackageAddOnItem = {
  id?: string;
  addOnKey: string;
  label: string;
  description?: string | null;
  benefitsJson?: unknown;
  sortOrder: number;
};

export type PackageContentItem = {
  id?: string;
  code: string;
  name: string;
  city: CityValue;
  language: LanguageValue;
  bathroomsCover: number;
  pricePaise: number;
  active: boolean;
  badge?: string | null;
  titleDescriptor?: string | null;
  bestFor?: string | null;
  outcome?: string | null;
  summary?: string | null;
  ctaLabel?: string | null;
  sortOrder: number;
  status: ModerationStatus;
  visualMediaId?: string | null;
  visualMedia?: MediaItem | null;
  features: PackageFeatureItem[];
  addOns: PackageAddOnItem[];
};

export type TestimonialContentItem = {
  id?: string;
  buyerName: string;
  relation?: string | null;
  city: CityValue;
  language: LanguageValue;
  testimonial: string;
  rating?: number | null;
  status: ModerationStatus;
  isFeatured: boolean;
  photoMediaId?: string | null;
  photoMedia?: MediaItem | null;
  sortOrder: number;
};

export type DoctorContentItem = {
  id?: string;
  doctorName: string;
  specialty: string;
  registrationNumber: string;
  registrationBody: string;
  city: CityValue;
  language: LanguageValue;
  statement: string;
  status: ModerationStatus;
  isFeatured: boolean;
  photoMediaId?: string | null;
  photoMedia?: MediaItem | null;
  sortOrder: number;
};

export type GalleryContentItem = {
  id?: string;
  title: string;
  caption: string;
  beforeMediaId?: string | null;
  afterMediaId?: string | null;
  beforeMedia?: MediaItem | null;
  afterMedia?: MediaItem | null;
  primaryTag?: string | null;
  secondaryTag?: string | null;
  sortOrder: number;
  status: ModerationStatus;
};

export type HomepageFaqItem = {
  question: string;
  answer: string;
};

export const homepageSectionOptions = [
  { value: "hero", label: "Hero" },
  { value: "packages", label: "Packages" },
  { value: "faq", label: "FAQ" },
  { value: "final-cta", label: "Final CTA" }
] as const;

export type HomepageSectionKey = (typeof homepageSectionOptions)[number]["value"];

export type HomepageSectionContentItem = {
  id?: string;
  sectionKey: HomepageSectionKey;
  title?: string | null;
  subtitle?: string | null;
  eyebrow?: string | null;
  body?: string | null;
  jsonPayload?: Record<string, unknown> | null;
  status: ModerationStatus;
};

export type ContentItemMap = {
  packages: PackageContentItem;
  testimonials: TestimonialContentItem;
  doctors: DoctorContentItem;
  gallery: GalleryContentItem;
  homepage: HomepageSectionContentItem;
  media: MediaItem;
};

export type ContentModuleMeta = {
  key: ContentModuleKey;
  title: string;
  description: string;
  route: string;
  legacyRoute: string;
  resourcePath: string;
  publishEntityType?: "package" | "testimonial" | "doctor" | "gallery" | "homepage-section";
  previewPath?: string;
};

export const contentModuleMeta: Record<ContentModuleKey, ContentModuleMeta> = {
  packages: {
    key: "packages",
    title: "Packages",
    description: "Maintain package structure, pricing, features, and media presentation.",
    route: "/crm/content/packages",
    legacyRoute: "/admin/packages",
    resourcePath: "/api/v1/internal/content/packages",
    publishEntityType: "package",
    previewPath: "/compare-packages"
  },
  testimonials: {
    key: "testimonials",
    title: "Testimonials",
    description: "Manage customer proof, featured stories, city targeting, and supporting photos.",
    route: "/crm/content/testimonials",
    legacyRoute: "/admin/testimonials",
    resourcePath: "/api/v1/internal/content/testimonials",
    publishEntityType: "testimonial",
    previewPath: "/"
  },
  doctors: {
    key: "doctors",
    title: "Doctors",
    description: "Manage doctor attestations, credentials, featured order, and proof imagery.",
    route: "/crm/content/doctors",
    legacyRoute: "/admin/doctors",
    resourcePath: "/api/v1/internal/content/doctors",
    publishEntityType: "doctor",
    previewPath: "/"
  },
  gallery: {
    key: "gallery",
    title: "Gallery",
    description: "Control before/after transformation pairs, captions, and tags.",
    route: "/crm/content/gallery",
    legacyRoute: "/admin/gallery",
    resourcePath: "/api/v1/internal/content/gallery",
    publishEntityType: "gallery",
    previewPath: "/"
  },
  homepage: {
    key: "homepage",
    title: "Homepage",
    description: "Edit launch homepage sections, CTAs, FAQs, and support copy.",
    route: "/crm/content/homepage",
    legacyRoute: "/admin/homepage",
    resourcePath: "/api/v1/internal/content/homepage",
    publishEntityType: "homepage-section",
    previewPath: "/"
  },
  media: {
    key: "media",
    title: "Media",
    description: "Upload and manage reusable image assets for content editors.",
    route: "/crm/content/media",
    legacyRoute: "/admin/media",
    resourcePath: "/api/v1/internal/content/media"
  }
};

export function isContentModuleKey(value: string): value is ContentModuleKey {
  return (contentModuleKeys as readonly string[]).includes(value);
}

function benefitsFromUnknown(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function createHomepageSeedItems(): HomepageSectionContentItem[] {
  return [
    {
      id: undefined,
      sectionKey: "hero",
      title: homepageContent.hero.heading,
      subtitle: homepageContent.hero.subcopy,
      eyebrow: homepageContent.hero.eyebrow,
      body: homepageContent.hero.subcopy,
      jsonPayload: {
        primaryCta: homepageContent.hero.primaryCta,
        secondaryCta: homepageContent.hero.secondaryCta,
        supportPoints: homepageContent.hero.supportPoints
      },
      status: "DRAFT"
    },
    {
      id: undefined,
      sectionKey: "packages",
      title: homepageContent.packagesSection.title,
      subtitle: homepageContent.packagesSection.subtitle,
      eyebrow: "Packages",
      body: homepageContent.packagesSection.subtitle,
      jsonPayload: {},
      status: "DRAFT"
    },
    {
      id: undefined,
      sectionKey: "faq",
      title: homepageContent.faqSection.title,
      subtitle: homepageContent.faqSection.subtitle,
      eyebrow: "FAQ",
      body: homepageContent.faqSection.subtitle,
      jsonPayload: { items: homepageContent.faqSection.items },
      status: "DRAFT"
    },
    {
      id: undefined,
      sectionKey: "final-cta",
      title: homepageContent.finalCtaSection.title,
      subtitle: homepageContent.finalCtaSection.subtitle,
      eyebrow: "Final CTA",
      body: homepageContent.finalCtaSection.subtitle,
      jsonPayload: {
        primaryCta: homepageContent.finalCtaSection.primaryCta,
        secondaryLabel: homepageContent.finalCtaSection.secondaryLabel
      },
      status: "DRAFT"
    }
  ];
}

export function mergeHomepageSectionItems(items: HomepageSectionContentItem[]) {
  const itemMap = new Map(items.map((item) => [item.sectionKey, item]));
  return createHomepageSeedItems().map((seed) => itemMap.get(seed.sectionKey) ?? seed);
}

export function getInitialContentItems(key: ContentModuleKey): Array<ContentItemMap[ContentModuleKey]> {
  switch (key) {
    case "packages":
      return comparePackagesContent.packagesSection.plans.map((plan, index) => ({
        id: undefined,
        code: plan.id,
        name: plan.name,
        city: "Mumbai",
        language: "EN",
        bathroomsCover: 1,
        pricePaise: Number(plan.price.replace(/[^0-9]/g, "")) * 100,
        active: true,
        badge: plan.badge || "",
        titleDescriptor: plan.titleDescriptor || "",
        bestFor: plan.bestFor || "",
        outcome: plan.outcome || "",
        summary: plan.summary || "",
        ctaLabel: plan.ctaLabel,
        sortOrder: index,
        status: "DRAFT",
        visualMediaId: "",
        features: comparePackagesContent.packagesSection.features
          .filter((feature) => plan.includedFeatureIds.includes(feature.id))
          .map((feature, featureIndex) => ({
            featureKey: feature.id,
            label: feature.label,
            description: feature.description || "",
            benefitsJson: feature.benefits || [],
            sortOrder: featureIndex
          })),
        addOns: (comparePackagesContent.packagesSection.addOnFeatures || []).map((feature, featureIndex) => ({
          addOnKey: feature.id,
          label: feature.label,
          description: feature.description || "",
          benefitsJson: feature.benefits || [],
          sortOrder: featureIndex
        }))
      }));
    case "testimonials":
      return homepageContent.testimonialsSection.items.map((item, index) => ({
        id: undefined,
        buyerName: item.author,
        relation: item.relation,
        city: item.city === "Goa" ? "Goa" : "Mumbai",
        language: "EN",
        testimonial: item.quote,
        rating: 5,
        status: "DRAFT",
        isFeatured: index < 2,
        photoMediaId: "",
        sortOrder: index
      }));
    case "doctors":
      return homepageContent.doctorsSection.items.map((item, index) => ({
        id: undefined,
        doctorName: item.doctorName,
        specialty: item.specialty,
        registrationNumber: item.registration,
        registrationBody: "Medical Council",
        city: item.city === "Goa" ? "Goa" : "Mumbai",
        language: "EN",
        statement: item.quote,
        status: "DRAFT",
        isFeatured: index < 2,
        photoMediaId: "",
        sortOrder: index
      }));
    case "gallery":
      return homepageContent.transformationGallerySection.items.map((item, index) => ({
        id: undefined,
        title: item.title,
        caption: item.caption,
        beforeMediaId: "",
        afterMediaId: "",
        primaryTag: item.tags?.[0] || "",
        secondaryTag: item.tags?.[1] || "",
        sortOrder: index,
        status: "DRAFT"
      }));
    case "homepage":
      return createHomepageSeedItems();
    case "media":
      return [];
  }
}

export function createEmptyContentItem(key: ContentModuleKey): ContentItemMap[ContentModuleKey] {
  switch (key) {
    case "packages":
      return {
        code: "package-new",
        name: "New package",
        city: "Mumbai",
        language: "EN",
        bathroomsCover: 1,
        pricePaise: 2500000,
        active: true,
        badge: "",
        titleDescriptor: "",
        bestFor: "",
        outcome: "",
        summary: "",
        ctaLabel: "Book Package",
        sortOrder: 0,
        status: "DRAFT",
        visualMediaId: "",
        features: [],
        addOns: []
      };
    case "testimonials":
      return {
        buyerName: "",
        relation: "",
        city: "Mumbai",
        language: "EN",
        testimonial: "",
        rating: 5,
        status: "DRAFT",
        isFeatured: false,
        photoMediaId: "",
        sortOrder: 0
      };
    case "doctors":
      return {
        doctorName: "",
        specialty: "",
        registrationNumber: "",
        registrationBody: "Medical Council",
        city: "Mumbai",
        language: "EN",
        statement: "",
        status: "DRAFT",
        isFeatured: false,
        photoMediaId: "",
        sortOrder: 0
      };
    case "gallery":
      return {
        title: "",
        caption: "",
        beforeMediaId: "",
        afterMediaId: "",
        primaryTag: "",
        secondaryTag: "",
        sortOrder: 0,
        status: "DRAFT"
      };
    case "homepage":
      return {
        sectionKey: "hero",
        title: "",
        subtitle: "",
        eyebrow: "",
        body: "",
        jsonPayload: {},
        status: "DRAFT"
      };
    case "media":
      return {
        id: "",
        storageKey: "",
        url: "",
        altText: null,
        mimeType: "",
        width: null,
        height: null,
        createdAt: new Date(0).toISOString()
      };
  }
}

export function getContentItemId(item: ContentItemMap[ContentModuleKey]) {
  return "id" in item && typeof item.id === "string" && item.id ? item.id : undefined;
}

export function getContentItemStatus(item: ContentItemMap[ContentModuleKey]) {
  return "status" in item && typeof item.status === "string" ? item.status : undefined;
}

export function getContentItemLabel(key: ContentModuleKey, item: ContentItemMap[ContentModuleKey]) {
  switch (key) {
    case "packages":
      return (item as PackageContentItem).name || (item as PackageContentItem).code || "Untitled package";
    case "testimonials":
      return (item as TestimonialContentItem).buyerName || "Untitled testimonial";
    case "doctors":
      return (item as DoctorContentItem).doctorName || "Untitled doctor";
    case "gallery":
      return (item as GalleryContentItem).title || "Untitled gallery item";
    case "homepage":
      return (item as HomepageSectionContentItem).sectionKey || "Untitled section";
    case "media":
      return (item as MediaItem).altText || (item as MediaItem).id || "Media asset";
  }
}

export function getPublishedCount(items: Array<ContentItemMap[ContentModuleKey]>) {
  return items.filter((item) => getContentItemStatus(item) === "PUBLISHED").length;
}

export function getMediaOptions(items: MediaItem[]) {
  return items.map((item) => ({
    value: item.id,
    label: item.altText ? `${item.altText} (${item.id.slice(0, 8)})` : item.id
  }));
}

export function toBenefitsLines(value: unknown) {
  return benefitsFromUnknown(value).join("\n");
}

export function parseBenefitsLines(value: string | undefined) {
  return (value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeFaqItems(value: unknown): HomepageFaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const question = typeof record.question === "string" ? record.question : "";
      const answer = typeof record.answer === "string" ? record.answer : "";
      if (!question && !answer) {
        return null;
      }

      return { question, answer };
    })
    .filter((item): item is HomepageFaqItem => Boolean(item));
}

export function canCreateNewRecord(key: ContentModuleKey) {
  return key !== "homepage" && key !== "media";
}
