/* The resolved public-site content model.

   Every value here has already been through resolution: the published (or,
   in draft mode, draft) Sanity value when it is present and valid, otherwise
   the fallback in lib/cms/fallback.ts. Components render these values; they
   never decide between CMS and code themselves. */

/** A heading as the editor writes it. A line break in `text` starts a new
    visual line; each entry in `highlights` is shown in the accent style. */
export type Heading = {
  text: string;
  highlights: string[];
};

/** An image that is either a Sanity asset (with responsive URLs) or a file
    shipped with the site. */
export type CmsImage = {
  src: string;
  srcSet?: string;
  alt: string;
  objectPosition?: string;
};

export type ContactSettings = {
  supportEmail: string;
  supportHours: string;
  phoneDisplay: string;
  /** `tel:+91…`, derived from the validated phone number. */
  phoneHref: string;
  whatsappUrl: string;
};

export type FooterContent = {
  heading: Heading;
  ctaLabel: string;
  tagline: string;
};

export type SiteSettingsContent = {
  contact: ContactSettings;
  footer: FooterContent;
  doctorDisclaimer: string;
};

export type EvidenceCard = { prefix?: string; value: string; label: string; copy: string };

export type HomeContent = {
  hero: {
    heading: Heading;
    subcopy: string;
    primaryCta: string;
    secondaryCta: string;
    /** One master image; `mobile` only when a separate portrait crop is set. */
    background: { desktop: CmsImage; mobile?: CmsImage };
  };
  stats: {
    eyebrow: string;
    heading: Heading;
    costLabel: string;
    costPrefix: string;
    costFigure: string;
    cards: EvidenceCard[];
    sourcesNote: string;
  };
  safer: { heading: Heading; description: string; image: CmsImage };
  why: { eyebrow: string; heading: Heading; subtitle: string; items: { title: string; description: string; tag: string }[] };
  transformations: {
    eyebrow: string;
    heading: Heading;
    subtitle: string;
    sliderBefore: CmsImage;
    sliderAfter: CmsImage;
    tiles: { image: CmsImage; label: string }[];
  };
  packages: { eyebrow: string; heading: Heading; subtitle: string; footnote: string };
  process: { eyebrow: string; heading: Heading; subtitle: string; ctaLabel: string; steps: { title: string; description: string }[] };
  doctors: {
    eyebrow: string;
    heading: Heading;
    subtitle: string;
    items: { name: string; credentials: string; meta: string; quote: string; photo?: CmsImage }[];
  };
  testimonials: {
    eyebrow: string;
    heading: Heading;
    subtitle: string;
    items: { name: string; relation: string; city: string; quote: string }[];
  };
  faq: { eyebrow: string; heading: Heading; subtitle: string; items: { question: string; answer: string }[] };
  finalCta: { eyebrow: string; heading: Heading; subtitle: string; ctaLabel: string; badges: string[]; image: CmsImage };
};

export type PackageCode = "package-standard" | "package-advanced";

export type ResolvedComponent = {
  /** Stable key, e.g. `raised-toilet-seat`. Code-owned. */
  id: string;
  title: string;
  category: string;
  quantity?: number;
  description?: string;
  image: CmsImage;
};

export type ResolvedPlan = {
  code: PackageCode;
  /** URL segment for /packages/<slug>. Code-owned. */
  slug: "standard" | "advanced";
  name: "Standard" | "Advanced";
  badge: string;
  titleDescriptor: string;
  bestFor: string;
  outcome: string;
  isPopular: boolean;
  /** Canonical selling price in rupees. */
  priceInr: number;
  referencePriceInr?: number;
  /** `priceInr` formatted for display, e.g. "₹29,999". */
  price: string;
  referencePrice?: string;
  savings: string;
  ctaLabel: string;
  visualHighlights: string[];
  componentIds: string[];
};

export type PackageRow = { label: string; standard: boolean; advanced: boolean };

export type PackagesContent = {
  plans: ResolvedPlan[];
  /** Every component referenced by a package, in display order. */
  components: ResolvedComponent[];
  rows: PackageRow[];
  popularLabel: string;
  homeCardCta: string;
  pageCardCta: string;
};

export type PackagesPageContent = {
  eyebrow: string;
  heading: Heading;
  subcopy: string;
  scrollCue: string;
  image: CmsImage;
  chooseLabel: string;
  chooseNote: string;
  kitCue: string;
  kitHeading: string;
  kitNote: string;
  kitFootnote: string;
};

export type ContactPageContent = {
  eyebrow: string;
  heading: Heading;
  intro: string;
  image: CmsImage;
  cardTitle: string;
  cardBody: string;
  callLabel: string;
  hoursLabel: string;
  emailLabel: string;
};

/** About page. Images are optional: until one is uploaded the layout keeps
    its labelled placeholder, exactly as it does today. */
export type AboutContent = {
  hero: { eyebrow: string; heading: Heading; paragraphs: string[]; ctaLabel: string; image?: CmsImage };
  story: { eyebrow: string; heading: Heading; beats: { label: string; body: string }[]; image?: CmsImage };
  statement: Heading;
  why: { eyebrow: string; heading: Heading; refusals: string[]; promise: string; hope: string };
  team: {
    eyebrow: string;
    heading: Heading;
    intro: string;
    trust: string[];
    founders: { name: string; role: string; bio: string; credentials: string[]; photo?: CmsImage }[];
  };
  approach: { eyebrow: string; heading: Heading; paragraphs: string[]; image?: CmsImage; routineLabel: string; routine: string[] };
  goals: { eyebrow: string; heading: Heading; intro: string; items: { label: string; body: string }[] };
  closing: { image?: CmsImage; heading: Heading; body: string; ctaLabel: string };
};

export type SeoEntry = {
  title?: string;
  description?: string;
  socialTitle?: string;
  socialDescription?: string;
  socialImage?: string;
};

export type SeoPageKey =
  | "home"
  | "about"
  | "packages"
  | "packageStandard"
  | "packageAdvanced"
  | "contact"
  | "why"
  | "privacy"
  | "terms";

export type SeoContent = Partial<Record<SeoPageKey, SeoEntry>>;

export type PublicSiteContent = {
  settings: SiteSettingsContent;
  home: HomeContent;
  packages: PackagesContent;
  packagesPage: PackagesPageContent;
  contactPage: ContactPageContent;
  about: AboutContent;
  seo: SeoContent;
};
