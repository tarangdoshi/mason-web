import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AssessmentLeadForm from "../../../components/assessment-lead-form";
import CmsImage from "../../../components/cms-image";
import {
  getAvailableAddOnsFromEntry,
  getIncludedFeaturesFromEntry,
  getPackageCatalogEntryData
} from "../../../../lib/site-content";
import styles from "../packages.module.css";

const SITE_URL = "https://www.masoncompany.in";

const SLUGS = ["standard", "advanced"] as const;
type Slug = (typeof SLUGS)[number];

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

function isSlug(value: string): value is Slug {
  return (SLUGS as readonly string[]).includes(value);
}

function packageIdForSlug(slug: Slug): string {
  return `package-${slug}`;
}

function absoluteImageUrl(src?: string): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${SITE_URL}${src}`;
  return undefined;
}

export function generateStaticParams(): { slug: string }[] {
  return SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isSlug(slug)) {
    return { title: "Packages | Mason Company" };
  }
  const entry = await getPackageCatalogEntryData(packageIdForSlug(slug));
  if (!entry) {
    return { title: "Packages | Mason Company" };
  }

  const { name } = entry.plan;
  const description =
    entry.plan.summary ||
    entry.plan.outcome ||
    `The Mason ${name} bathroom safety package — installed by a trained Mason team after a free safety assessment.`;
  const title = `${name} Bathroom Safety Package | Mason Company`;
  const url = `${SITE_URL}/packages/${slug}`;
  const ogImage = absoluteImageUrl(entry.plan.visual?.src);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, alt: entry.plan.visual?.alt || `${name} package` }] } : {})
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description
    }
  };
}

export default async function PackageDetailPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isSlug(slug)) {
    notFound();
  }
  const entry = await getPackageCatalogEntryData(packageIdForSlug(slug));
  if (!entry) {
    notFound();
  }

  const plan = entry.plan;
  const includedFeatures = getIncludedFeaturesFromEntry(entry);
  const addOns = getAvailableAddOnsFromEntry(entry);
  const otherSlug: Slug = slug === "standard" ? "advanced" : "standard";
  const otherName = otherSlug === "standard" ? "Standard" : "Advanced";
  const checkoutHref = `/checkout/${plan.id}`;
  const pageUrl = `${SITE_URL}/packages/${slug}`;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${plan.name} Bathroom Safety Package`,
    serviceType: "Bathroom safety installation",
    provider: { "@type": "Organization", name: "Mason Company", url: SITE_URL },
    areaServed: ["Mumbai", "Goa"],
    description: plan.summary || plan.outcome || `Mason ${plan.name} bathroom safety package.`,
    url: pageUrl
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Packages", item: `${SITE_URL}/compare-packages` },
      { "@type": "ListItem", position: 3, name: plan.name, item: pageUrl }
    ]
  };

  return (
    <main className={styles.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className={styles.container}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>›</span>
          <Link href="/compare-packages">Packages</Link>
          <span aria-hidden>›</span>
          <span aria-current="page">{plan.name}</span>
        </nav>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            {plan.badge ? <span className={styles.badge}>{plan.badge}</span> : null}
            <h1 className={styles.title}>{plan.name} bathroom safety package</h1>
            {plan.titleDescriptor ? <p className={styles.descriptor}>{plan.titleDescriptor}</p> : null}
            {plan.bestFor ? <p className={styles.bestFor}>{plan.bestFor}</p> : null}
            {plan.price ? <p className={styles.price}>{plan.price}</p> : null}
            <div className={styles.ctaRow}>
              <a href="#book-assessment" className={styles.primaryCta} data-analytics-cta-location="package-detail-hero">
                Book Free Safety Assessment
              </a>
              <Link
                href={checkoutHref}
                className={styles.secondaryCta}
                data-analytics-event="package_cta_click"
                data-analytics-package={plan.id}
                data-analytics-cta-location="package-detail-hero"
                data-analytics-section="package-detail"
              >
                See booking &amp; pricing
              </Link>
            </div>
            <p className={styles.assessmentNote}>
              Not sure if it fits? Start with a free assessment — Mason recommends the right scope before you commit.
            </p>
          </div>
          {plan.visual?.src ? (
            <div className={styles.heroVisual}>
              <CmsImage
                visual={plan.visual}
                fallbackAlt={`${plan.name} package`}
                width={1200}
                height={960}
                sizes="(max-width: 860px) calc(100vw - 2rem), 540px"
              />
            </div>
          ) : null}
        </section>

        {plan.outcome ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>The outcome</h2>
            <p className={styles.lead}>{plan.outcome}</p>
          </section>
        ) : null}

        {includedFeatures.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What&apos;s included</h2>
            <ul className={styles.featureList}>
              {includedFeatures.map((feature) => (
                <li key={feature.id} className={styles.featureItem}>
                  <span className={styles.featureLabel}>{feature.label}</span>
                  {feature.description ? <span className={styles.featureDesc}>{feature.description}</span> : null}
                  {feature.benefits && feature.benefits.length > 0 ? (
                    <ul className={styles.benefitList}>
                      {feature.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {plan.visualHighlights && plan.visualHighlights.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Highlights</h2>
            <ul className={styles.highlights}>
              {plan.visualHighlights.map((highlight, index) => (
                <li key={index}>{highlight}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {addOns.length > 0 ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Optional add-ons</h2>
            <p className={styles.muted}>
              Add-ons are optional and confirmed during your assessment — no online configuration needed.
            </p>
            <ul className={styles.featureList}>
              {addOns.map((feature) => (
                <li key={feature.id} className={styles.featureItem}>
                  <span className={styles.featureLabel}>{feature.label}</span>
                  {feature.description ? <span className={styles.featureDesc}>{feature.description}</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Why families trust Mason</h2>
          <ul className={styles.trustStrip}>
            <li>Doctor-reviewed safety approach</li>
            <li>One trained, accountable Mason team</li>
            <li>One scheduled visit — often same-day install</li>
            <li>Pay online or on installation</li>
          </ul>
          <p className={styles.muted}>
            See <Link href="/evidence">doctor validation &amp; evidence</Link>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <ol className={styles.process}>
            <li>Book a free safety assessment (home visit or video).</li>
            <li>Mason assesses the bathroom and confirms the right package.</li>
            <li>Install — often in the same visit if you&apos;re ready.</li>
            <li>Walkthrough &amp; handover with before/after photos.</li>
          </ol>
        </section>

        <section className={styles.assessmentSection} id="book-assessment">
          <p className={styles.eyebrow}>Free safety assessment</p>
          <h2 className={styles.sectionTitle}>Book your free safety assessment</h2>
          <p className={styles.muted}>
            Share a few details and Mason will contact you to schedule a home visit or video assessment before you
            choose a package.
          </p>
          <AssessmentLeadForm />
        </section>

        <nav className={styles.crossLinks} aria-label="More packages">
          <Link href={`/packages/${otherSlug}`}>Compare with the {otherName} package</Link>
          <Link href="/compare-packages">See full comparison</Link>
          <Link
            href={checkoutHref}
            className={styles.secondaryCta}
            data-analytics-event="package_cta_click"
            data-analytics-package={plan.id}
            data-analytics-cta-location="package-detail-crosslinks"
            data-analytics-section="package-detail"
          >
            Proceed to booking
          </Link>
        </nav>
      </div>
    </main>
  );
}
