import type { HomepageContent } from "../../../content/types";
import PackageCheckoutLink from "../../components/package-checkout-link";
import CmsImage from "../../components/cms-image";
import RiskQuiz from "../../components/risk-quiz";
import styles from "./compare-packages.module.css";

type PreviewState = "live" | "draft" | "draft-auth-required" | "draft-unavailable";

function packageCheckoutHref(planId: string) {
  return `/checkout/${planId}`;
}

export default function ComparePackagesView({
  content,
  previewState = "live"
}: {
  content: HomepageContent;
  previewState?: PreviewState;
}) {
  const { hero, riskQuizSection, packagesSection, processSection, brand, finalCtaSection } = content;
  const plans = packagesSection.plans.slice(0, 2);
  const addOn = packagesSection.addOnFeatures?.[0];
  const matrixFeatures = packagesSection.features;
  const recommendedQuizPlan = plans[1]?.name ?? plans[0]?.name ?? "Comfort";
  const phoneHref = `tel:${brand.phoneTel}`;
  const previewMessage =
    previewState === "draft"
      ? "You are reviewing unpublished Content Studio changes."
      : previewState === "draft-auth-required"
        ? "Draft preview needs an active CRM session. This page is showing live content instead."
        : "Draft preview could not be loaded. This page is showing live content instead.";

  return (
    <main className={styles.page}>
      {previewState !== "live" ? (
        <section
          className={`${styles.previewBanner} ${previewState === "draft" ? styles.previewBannerDraft : styles.previewBannerWarning}`.trim()}
        >
          <div className={styles.previewBannerInner}>
            <strong>{previewState === "draft" ? "Draft preview" : "Preview unavailable"}</strong>
            <span>{previewMessage}</span>
          </div>
        </section>
      ) : null}

      <section className={styles.heroSection}>
        <div className={styles.heroShell}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Package clarity</p>
            <h1>{packagesSection.title}</h1>
            <p>{packagesSection.subtitle}</p>
            <div className={styles.heroActions}>
              <a
                href="/#free-assessment"
                className={styles.primaryButton}
                data-analytics-event="homepage_cta_click"
                data-analytics-cta-location="compare-hero-primary"
                data-analytics-section="compare-hero"
              >
                Book Free Safety Assessment
              </a>
              <a href="#packages" className={styles.secondaryButton}>
                Compare plans
              </a>
            </div>
            <div className={styles.heroChips}>
              {hero.supportPoints?.slice(0, 3).map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>
          </div>

          <article className={styles.heroSummaryCard}>
            <p className={styles.cardEyebrow}>Assessment first</p>
            <h2>Use packages to understand your options.</h2>
            <p>Most families start with a free assessment. If you already know what you need, you can compare package scope and continue to checkout.</p>
            <ul>
              <li>Free assessment requires no package selection</li>
              <li>Quiz recommendation is a guide, not a final recommendation</li>
              <li>AMC is available as an add-on</li>
            </ul>
          </article>
        </div>
      </section>

      <section className={styles.section} id="risk-quiz">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Quick screening</p>
            <h2>{riskQuizSection.title}</h2>
          </div>
          <p>{riskQuizSection.subtitle}</p>
        </div>

        <div className={styles.quizSectionGrid}>
          <div className={styles.quizIntroCard}>
            <h3>What this quiz does</h3>
            <p>{riskQuizSection.intro}</p>
            <p className={styles.quizAssessmentNote}>For the safest recommendation, Mason should confirm the bathroom through a free home visit or video assessment.</p>
            <div className={styles.bandList}>
              {riskQuizSection.bands.map((band) => (
                <article key={band.id} className={styles.bandCard}>
                  <p className={styles.bandLabel}>{band.label}</p>
                  <p>{band.summary}</p>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.quizCardWrap}>
            <RiskQuiz section={riskQuizSection} packagesSectionId="packages" fallbackPlan={recommendedQuizPlan} />
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionMuted}`} id="packages">
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>Compare plans</p>
            <h2>Compare package options with confidence.</h2>
          </div>
          <p>Packages are here for pricing and scope clarity. Start with a free assessment if you are unsure which option fits your parent’s bathroom.</p>
        </div>

        <div className={styles.assessmentCallout}>
          <div>
            <p className={styles.cardEyebrow}>Unsure which package fits?</p>
            <h3>Start with the assessment, then choose with confidence.</h3>
            <p>No package selection or payment is required to request the assessment.</p>
          </div>
          <a
            href="/#free-assessment"
            className={styles.primaryButton}
            data-analytics-event="homepage_cta_click"
            data-analytics-cta-location="compare-packages-assessment-callout"
            data-analytics-section="packages"
          >
            Book Free Safety Assessment
          </a>
        </div>

        <div className={styles.planGrid}>
          {plans.map((plan) => {
            const included = matrixFeatures.filter((feature) => plan.includedFeatureIds.includes(feature.id));
            return (
              <article key={plan.id} className={styles.planCard} data-plan-name={plan.name}>
                <div className={styles.planVisualWrap}>
                  {plan.visual?.src ? (
                    <CmsImage
                      visual={plan.visual}
                      fallbackAlt={plan.name}
                      width={1200}
                      height={960}
                      sizes="(max-width: 760px) calc(100vw - 2rem), 560px"
                      className={styles.planVisual}
                    />
                  ) : null}
                  {plan.badge ? <span className={styles.planBadge}>{plan.badge}</span> : null}
                </div>
                <div className={styles.planBody}>
                  <p className={styles.planName}>{plan.name}</p>
                  <h3>{plan.titleDescriptor || plan.name}</h3>
                  <p className={styles.planPrice}>{plan.price}</p>
                  <p>{plan.bestFor || plan.outcome}</p>
                  <ul className={styles.planFeatureList}>
                    {included.slice(0, 6).map((feature) => (
                      <li key={`${plan.id}-${feature.id}`}>{feature.label}</li>
                    ))}
                  </ul>
                  <PackageCheckoutLink
                    href={packageCheckoutHref(plan.id)}
                    className={styles.primaryButton}
                    entryPoint="compare-packages-plan-card"
                    pageSection="packages"
                    ctaId={`book-${plan.id}`}
                    packageCode={plan.id}
                    packageName={plan.name}
                  >
                    {`Continue with ${plan.name}`}
                  </PackageCheckoutLink>
                  <a href={`/packages/${plan.id.replace("package-", "")}`} className={styles.secondaryButton}>
                    {`Explore ${plan.name}`}
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.matrixWrap}>
          <table className={styles.matrix}>
            <thead>
              <tr>
                <th>Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id}>{plan.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixFeatures.map((feature) => (
                <tr key={feature.id}>
                  <td>
                    <strong>{feature.label}</strong>
                    {feature.description ? <span>{feature.description}</span> : null}
                  </td>
                  {plans.map((plan) => (
                    <td key={`${feature.id}-${plan.id}`}>{plan.includedFeatureIds.includes(feature.id) ? "Included" : "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} id={processSection.id}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.eyebrow}>What happens next</p>
            <h2>{processSection.title}</h2>
          </div>
          <p>{processSection.subtitle}</p>
        </div>

        <div className={styles.supportGrid}>
          <div className={styles.processGrid}>
            {processSection.steps.slice(0, 4).map((step, index) => (
              <article key={step.id} className={styles.processCard}>
                <div className={styles.processNumber}>0{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>

          <aside className={styles.sidePanel}>
            {addOn ? (
              <div className={styles.addOnCard}>
                <p className={styles.cardEyebrow}>AMC add-on</p>
                <h3>{addOn.label}</h3>
                <p>{addOn.description}</p>
                {addOn.benefits?.length ? (
                  <ul>
                    {addOn.benefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className={styles.paymentCard}>
              <p className={styles.cardEyebrow}>Payment clarity</p>
              <h3>Package checkout is for confident customers.</h3>
              <ul>
                <li>Start with an assessment if you need help choosing</li>
                <li>Online payment keeps the base package total</li>
                <li>Pay on installation adds ₹500 service fee</li>
                <li>AMC is calculated at 15% of package price</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.ctaSection} id={finalCtaSection.id || "compare-cta"}>
        <div className={styles.ctaPanel}>
          <div className={styles.ctaCopy}>
            <p className={styles.cardEyebrow}>Best first step</p>
            <h2>Book a free safety assessment before choosing a package.</h2>
            <p>If you are confident about the package, the package cards above still take you to checkout.</p>
          </div>
          <div className={styles.ctaActions}>
            <a
              href="/#free-assessment"
              className={styles.primaryButton}
              data-analytics-event="homepage_cta_click"
              data-analytics-cta-location="compare-final-primary"
              data-analytics-section={finalCtaSection.id || "compare-cta"}
            >
              Book Free Safety Assessment
            </a>
            <a
              href={phoneHref}
              className={styles.secondaryButton}
              data-analytics-cta-location="compare-final-cta"
              data-analytics-section={finalCtaSection.id || "compare-cta"}
            >
              {finalCtaSection.secondaryLabel}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
