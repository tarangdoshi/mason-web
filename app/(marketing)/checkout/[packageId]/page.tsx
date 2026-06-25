import type { Metadata } from "next";
import Link from "next/link";
import CmsImage from "../../../components/cms-image";
import { notFound } from "next/navigation";
import CheckoutExperience from "../components/checkout-experience";
import {
  getAvailableAddOnsFromEntry,
  getExcludedFeaturesFromEntry,
  getIncludedFeaturesFromEntry,
  getPackageCatalogEntryData
} from "../../../../lib/site-content";
import styles from "../checkout.module.css";

type PageProps = {
  params: Promise<{
    packageId: string;
  }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { packageId } = await params;
  const entry = await getPackageCatalogEntryData(packageId);

  if (!entry) {
    return {
      title: "Checkout | Mason Company"
    };
  }

  return {
    title: `${entry.plan.name} Package Request | Mason Company`,
    description: `Request the ${entry.plan.name} package if you already know it fits, or start with a free Mason safety assessment.`
  };
}

export default async function PackageCheckoutPage({ params }: PageProps) {
  const { packageId } = await params;
  const entry = await getPackageCatalogEntryData(packageId);

  if (!entry) {
    notFound();
  }

  const includedFeatures = getIncludedFeaturesFromEntry(entry);
  const excludedFeatures = getExcludedFeaturesFromEntry(entry);
  const addOnFeatures = getAvailableAddOnsFromEntry(entry);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.heroHeader}>
          <div className={styles.heroShell}>
            <section className={styles.heroIntro}>
              <Link href="/" className={styles.backLink}>
                Back to homepage
              </Link>
              <div className={styles.heroCopy}>
                <p className={styles.eyebrow}>Package request</p>
                <h1 className={styles.heroTitle}>Request the {entry.plan.name} package if you are ready to proceed.</h1>
                <p className={styles.heroLead}>
                  Use this flow if you already know this package is right. Mason will review the request and confirm details before the booking is finalized.
                </p>
              </div>
              <div className={styles.heroActions}>
                <a href="#checkout-location" className={styles.heroPrimaryCta}>
                  Continue with this package
                </a>
                <Link href="/#free-assessment" className={styles.heroSecondaryCta}>
                  Not sure? Book Free Assessment
                </Link>
                <Link href="/compare-packages#packages" className={styles.heroSecondaryCta}>
                  Compare packages
                </Link>
              </div>
              <div className={styles.heroTrustRow} aria-label="Checkout trust points">
                <span className={styles.heroTrustItem}>For confident customers</span>
                <span className={styles.heroTrustItem}>Live total updates</span>
                <span className={styles.heroTrustItem}>No online payment collected here</span>
              </div>
            </section>

            <aside className={styles.heroSummaryCard} aria-label="Selected package overview">
              <div className={styles.heroSummaryVisualWrap}>
                {entry.plan.visual?.src ? (
                  <CmsImage
                    visual={entry.plan.visual}
                    fallbackAlt={entry.plan.name}
                    width={1200}
                    height={960}
                    sizes="(max-width: 900px) calc(100vw - 2rem), 420px"
                    className={styles.heroSummaryVisual}
                  />
                ) : (
                  <div className={styles.heroSummaryVisualPlaceholder} aria-hidden="true">
                    {entry.plan.name}
                  </div>
                )}
                {entry.plan.badge ? <span className={styles.heroSummaryBadge}>{entry.plan.badge}</span> : null}
              </div>

              <div className={styles.heroSummaryBody}>
                <div className={styles.heroSummaryHeader}>
                  <p className={styles.summaryKicker}>Selected package</p>
                  <h2 className={styles.heroSummaryTitle}>{entry.plan.titleDescriptor || entry.plan.name}</h2>
                  <p className={styles.heroSummaryCopy}>{entry.plan.bestFor || entry.sectionSubtitle}</p>
                </div>

                <div className={styles.heroSummaryPriceRow}>
                  <strong className={styles.heroSummaryPrice}>{entry.plan.price}</strong>
                  <span className={styles.heroSummaryNote}>Base package price</span>
                </div>

                {entry.plan.visualHighlights?.length ? (
                  <div className={styles.heroHighlightRow}>
                    {entry.plan.visualHighlights.slice(0, 3).map((highlight) => (
                      <span key={highlight} className={styles.heroHighlightChip}>
                        {highlight}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        </header>

        <CheckoutExperience
          entry={entry}
          includedFeatures={includedFeatures}
          excludedFeatures={excludedFeatures}
          addOnFeatures={addOnFeatures}
        />
      </div>
    </main>
  );
}
