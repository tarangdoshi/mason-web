import Link from "next/link";
import type { HomepageContent, PackagePlanContent } from "../content/types";
import AssessmentLeadForm from "./components/assessment-lead-form";
import BeforeAfterSlider from "./components/before-after-slider";
import CmsImage from "./components/cms-image";
import PackageCheckoutLink from "./components/package-checkout-link";
import styles from "./homepage.module.css";

type SearchParams = {
  variant?: string | string[];
};

type PreviewState = "live" | "draft" | "draft-auth-required" | "draft-unavailable";

function packageCheckoutHref(planId: string) {
  return `/checkout/${planId}`;
}

function packageDetailHref(planId: string) {
  return `/packages/${planId.replace("package-", "")}`;
}

function formatStepNumber(index: number) {
  return String(index + 1).padStart(2, "0");
}

function renderWhyIllustration(index: number) {
  const variant = index % 6;

  if (variant === 0) {
    return (
      <svg className={styles.illustrationSvg} viewBox="0 0 344 96" role="img" aria-label="Bathroom routine planning diagram">
        <path className={styles.illustrationSurface} d="M18 56h55l18-22h96l23 31h72l23-24" />
        <path className={styles.illustrationLine} d="M6 56h28m276 0h28" />
        <rect className={styles.illustrationObject} x="52" y="20" width="42" height="32" rx="8" />
        <circle className={styles.illustrationAccent} cx="73" cy="36" r="8" />
        <rect className={styles.illustrationObject} x="182" y="20" width="34" height="14" rx="5" />
        <rect className={styles.illustrationObject} x="260" y="18" width="64" height="54" rx="10" />
        <path className={styles.illustrationLine} d="M280 30h24m-24 16h24" />
        <text x="10" y="76">Entry</text>
        <text x="58" y="14">Sink</text>
        <text x="180" y="14">Toilet</text>
        <text x="265" y="14">Shower</text>
      </svg>
    );
  }

  if (variant === 1) {
    return (
      <svg className={styles.illustrationSvg} viewBox="0 0 344 96" role="img" aria-label="Doctor-informed safety planning">
        <circle className={styles.illustrationObject} cx="70" cy="30" r="18" />
        <path className={styles.illustrationSurface} d="M52 58c10-9 26-9 36 0" />
        <rect className={styles.illustrationObject} x="124" y="12" width="100" height="74" rx="12" />
        <path className={styles.illustrationLine} d="M150 56h54m-54 15h42" />
        <path className={styles.illustrationAccent} d="M166 25h18v10h10v16h-10v10h-18V51h-10V35h10z" />
        <circle className={styles.illustrationObject} cx="272" cy="31" r="16" />
        <path className={styles.illustrationSurface} d="M252 58c10-8 30-8 40 0" />
        <path className={styles.illustrationLine} d="M100 48h22m102 0h22" />
      </svg>
    );
  }

  if (variant === 2) {
    return (
      <svg className={styles.illustrationSvg} viewBox="0 0 344 96" role="img" aria-label="Trained Mason installation experts">
        <path className={styles.illustrationLine} d="M58 24v48m180-50v56" />
        <rect className={styles.illustrationAccent} x="150" y="24" width="88" height="12" rx="6" />
        <rect className={styles.illustrationAccent} x="150" y="58" width="88" height="12" rx="6" />
        <circle className={styles.illustrationObject} cx="70" cy="20" r="13" />
        <path className={styles.illustrationSurface} d="M48 46h44m-32 0v30m20-30v30" />
        <path className={styles.illustrationObject} d="M274 20h28l-6 18h-16z" />
        <path className={styles.illustrationLine} d="M288 38v32m-12 0h24" />
        <path className={styles.illustrationAccentLine} d="M102 48h34m112 0h36" />
      </svg>
    );
  }

  if (variant === 3) {
    return (
      <svg className={styles.illustrationSvg} viewBox="0 0 344 96" role="img" aria-label="One accountable team workflow">
        {[56, 116, 176, 236, 296].map((x, itemIndex) => (
          <g key={x}>
            <circle className={itemIndex === 2 ? styles.illustrationAccent : styles.illustrationObject} cx={x} cy="44" r="18" />
            <text x={x - 5} y="49">{itemIndex + 1}</text>
          </g>
        ))}
        <path className={styles.illustrationAccentLine} d="M74 44h24m36 0h24m36 0h24m36 0h24" />
        <path className={styles.illustrationLine} d="M56 70h240" />
      </svg>
    );
  }

  if (variant === 4) {
    return (
      <svg className={styles.illustrationSvg} viewBox="0 0 344 96" role="img" aria-label="Premium home-first finish">
        <path className={styles.illustrationObject} d="M44 72V35l70-18 70 18v37z" />
        <path className={styles.illustrationLine} d="M44 35h140M76 72V46h36v26" />
        <rect className={styles.illustrationAccent} x="204" y="34" width="92" height="12" rx="6" />
        <rect className={styles.illustrationObject} x="204" y="56" width="72" height="12" rx="6" />
        <path className={styles.illustrationAccentLine} d="M300 40h28m-14-14v28" />
      </svg>
    );
  }

  return (
    <svg className={styles.illustrationSvg} viewBox="0 0 344 96" role="img" aria-label="Evidence-led prevention diagram">
      <rect className={styles.illustrationObject} x="40" y="24" width="74" height="48" rx="8" />
      <path className={styles.illustrationLine} d="M55 58h44m-44-16h44" />
      <circle className={styles.illustrationAccent} cx="162" cy="48" r="28" />
      <path className={styles.illustrationSurface} d="M150 48l8 8 18-20" />
      <rect className={styles.illustrationObject} x="218" y="28" width="86" height="12" rx="6" />
      <rect className={styles.illustrationObject} x="218" y="52" width="64" height="12" rx="6" />
      <path className={styles.illustrationAccentLine} d="M114 48h20m56 0h20" />
    </svg>
  );
}

function renderPackageDiagram(plan: PackagePlanContent, isFeatured: boolean) {
  const hasCommodeSupport = plan.includedFeatureIds.includes("commode-support");
  const hasSlippersTwo = plan.includedFeatureIds.includes("slippers-two");
  const supports = isFeatured ? ["PVD-coated bars", "Raised-seat support", "Premium mats"] : ["Grab bars", "Anti-slip mats", "Sensor light"];

  return (
    <svg className={styles.packageDiagramSvg} viewBox="0 0 520 310" role="img" aria-label={`${plan.name} safety package layout diagram`}>
      <rect className={styles.diagramRoom} x="30" y="34" width="460" height="210" rx="18" />
      <path className={styles.diagramTile} d="M70 72h140m-140 36h120m-120 36h150m-150 36h100" />
      <rect className={styles.diagramFixture} x="88" y="82" width="72" height="46" rx="12" />
      <circle className={styles.diagramFixture} cx="124" cy="105" r="14" />
      <rect className={styles.diagramFixture} x="232" y="82" width="60" height="38" rx="10" />
      <path className={styles.diagramFixture} d="M350 72h80v92h-80z" />
      <path className={styles.diagramAccentLine} d="M74 178h158m-46-54v54m122-12h122m-80-80v80" />
      <circle className={styles.diagramPin} cx="186" cy="124" r="12" />
      <circle className={styles.diagramPin} cx="308" cy="166" r="12" />
      <circle className={styles.diagramPin} cx="430" cy="86" r="12" />
      {hasCommodeSupport ? <path className={styles.diagramPremium} d="M240 132h70v54h-70z" /> : null}
      <g className={styles.diagramLegend}>
        {supports.map((label, index) => (
          <g key={label} transform={`translate(354 ${185 + index * 22})`}>
            <circle cx="0" cy="0" r="5" />
            <text x="14" y="5">{label}</text>
          </g>
        ))}
      </g>
      <text className={styles.diagramLabel} x="56" y="278">{hasSlippersTwo ? "Full support route" : "Core support route"}</text>
    </svg>
  );
}

export default async function HomePageView({
  content,
  previewState = "live"
}: {
  content: HomepageContent;
  previewState?: PreviewState;
  searchParams?: Promise<SearchParams>;
}) {
  const {
    nav,
    brand,
    hero,
    evidenceSection,
    whySection,
    transformationGallerySection,
    packagesSection,
    processSection,
    doctorsSection,
    faqSection,
    finalCtaSection
  } = content;

  const plans = packagesSection.plans.slice(0, 2);
  const evidenceCards = evidenceSection.cards.slice(0, 4);
  const whyItems = whySection.items.slice(0, 6);
  const transformationItems = transformationGallerySection.items
    .filter((item) => item.before.src && item.after.src)
    .slice(0, 4);
  const featuredTransformation = transformationItems[0];
  const supportingTransformations = transformationItems.slice(1, 4);
  const transformationTags = Array.from(new Set(transformationItems.flatMap((item) => item.tags ?? []))).slice(0, 4);
  const processSteps = processSection.steps.slice(0, 6);
  const processHighlights = processSection.highlights?.filter(Boolean) ?? [];
  const doctors = doctorsSection.items.slice(0, 3);
  const faqItems = faqSection.items.filter((item) => item.question && item.answer);

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

      <header className={styles.topNav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brandLockup} aria-label="Go to Mason Company homepage">
            <span className={styles.brandMark} aria-hidden="true">
              M
            </span>
            <span className={styles.brandText}>
              <strong>Mason Company</strong>
              <span>Bathroom Safety · Home First</span>
            </span>
          </Link>

          <div className={styles.navCluster}>
            <nav className={styles.navLinks} aria-label="Primary navigation">
              {nav.links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>

            <a
              href="#free-assessment"
              className={styles.navCta}
              data-analytics-event="homepage_cta_click"
              data-analytics-cta-location="top-nav"
              data-analytics-section="header"
            >
              Book Free Safety Assessment
            </a>
          </div>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <p className={styles.eyebrow}>{hero.eyebrow}</p>
            <h1 className={styles.heroTitle}>{hero.heading}</h1>
            <p className={styles.heroSubtitle}>Bathroom safety upgrades in one scheduled visit, starting with a free Mason assessment.</p>

            <div className={styles.heroButtons}>
              <a
                href="#free-assessment"
                className={styles.primaryButton}
                data-analytics-event="homepage_cta_click"
                data-analytics-cta-location="hero-primary"
                data-analytics-section="hero"
              >
                Book Free Safety Assessment
              </a>
              <a
                href="#package-comparison"
                className={styles.secondaryButtonDark}
                data-analytics-event="homepage_cta_click"
                data-analytics-cta-location="hero-secondary"
                data-analytics-section="hero"
              >
                See Packages
              </a>
            </div>

            {hero.supportPoints?.length ? (
              <div className={styles.heroChips} aria-label="Quick trust points">
                {hero.supportPoints.slice(0, 3).map((point) => (
                  <span key={point}>{point}</span>
                ))}
              </div>
            ) : null}
          </div>

          <aside className={styles.heroVisual} aria-label="Before and after bathroom safety transformation">
            <BeforeAfterSlider
              beforeImage={hero.visual.beforeImage || hero.visual.image}
              afterImage={hero.visual.afterImage || hero.visual.image}
              beforeImageMobile={hero.visual.beforeImageMobile}
              beforeImageDesktop={hero.visual.beforeImageDesktop}
              afterImageMobile={hero.visual.afterImageMobile}
              afterImageDesktop={hero.visual.afterImageDesktop}
              beforeAlt={hero.visual.beforeAlt || `${hero.visual.alt} before`}
              afterAlt={hero.visual.afterAlt || `${hero.visual.alt} after`}
              beforeLabel={hero.visual.beforeLabel || "Before"}
              afterLabel={hero.visual.afterLabel || "After"}
              autoplayMs={hero.visual.autoplayMs}
              fallbackImage={hero.visual.image}
              fallbackAlt={hero.visual.alt}
              loading="eager"
            />
            <p className={styles.heroVisualCaption}>Bathroom safety transformations that feel like home.</p>
          </aside>
        </div>
      </section>

      <section className={styles.evidenceSection} id="safety">
        <div className={styles.evidenceGrid}>
          {evidenceCards.map((card) => (
            <article key={card.id} className={styles.evidenceCard}>
              <p className={styles.statValue}>{card.value}</p>
              <h2>{card.kicker || card.label}</h2>
              <p>{card.context || card.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.whySection} id="why-mason">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Why Us</p>
          <h2>{whySection.title}</h2>
          <p>{whySection.subtitle}</p>
        </div>

        <div className={styles.whyGrid}>
          {whyItems.map((item, index) => (
            <article key={item.title} className={styles.whyCard}>
              <div className={styles.illustration}>
                {renderWhyIllustration(index)}
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.transformationSection} id="transformations">
        <div className={styles.transformationCopy}>
          <p className={styles.eyebrow}>Transformations</p>
          <h2>{transformationGallerySection.title}</h2>
          <p>{transformationGallerySection.subtitle}</p>
          <div className={styles.transformationTags}>
            {(transformationTags.length ? transformationTags : ["Grip", "Balance", "Comfort", "Ease"]).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        <div className={styles.transformationGallery} aria-label="Before and after transformation gallery">
          {featuredTransformation ? (
            <article className={styles.transformationFeatured}>
              <div className={styles.transformationFeaturedSlider}>
                <BeforeAfterSlider
                  beforeImage={featuredTransformation.before.src}
                  afterImage={featuredTransformation.after.src}
                  beforeAlt={featuredTransformation.before.alt || `${featuredTransformation.title} before`}
                  afterAlt={featuredTransformation.after.alt || `${featuredTransformation.title} after`}
                  beforeLabel={featuredTransformation.before.label || "Before"}
                  afterLabel={featuredTransformation.after.label || "After"}
                  fallbackImage={featuredTransformation.after.src || featuredTransformation.before.src || hero.visual.image}
                  fallbackAlt={featuredTransformation.after.alt || featuredTransformation.before.alt || featuredTransformation.title}
                />
              </div>
              <div className={styles.transformationFeaturedCopy}>
                <h3>{featuredTransformation.title}</h3>
                <p>{featuredTransformation.caption}</p>
              </div>
            </article>
          ) : (
            <div className={styles.transformationPlaceholder}>Gallery images coming soon.</div>
          )}

          {supportingTransformations.length ? (
            <div className={styles.transformationMiniGrid}>
              {supportingTransformations.map((item) => (
                <article key={item.id} className={styles.transformationMiniCard}>
                  <div className={styles.transformationMiniVisual}>
                    <div className={styles.transformationMiniImageWrap}>
                      <CmsImage
                        visual={item.before}
                        fallbackAlt={item.before.alt || `${item.title} before`}
                        width={600}
                        height={450}
                        sizes="(max-width: 720px) 50vw, 180px"
                        className={styles.transformationMiniImage}
                      />
                      <span>{item.before.label || "Before"}</span>
                    </div>
                    <div className={styles.transformationMiniImageWrap}>
                      <CmsImage
                        visual={item.after}
                        fallbackAlt={item.after.alt || `${item.title} after`}
                        width={600}
                        height={450}
                        sizes="(max-width: 720px) 50vw, 180px"
                        className={styles.transformationMiniImage}
                      />
                      <span>{item.after.label || "After"}</span>
                    </div>
                  </div>
                  <div className={styles.transformationMiniCopy}>
                    <h3>{item.title}</h3>
                    <p>{item.caption}</p>
                    {item.tags?.length ? (
                      <div className={styles.transformationMiniTags}>
                        {item.tags.slice(0, 2).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.packageSection} id="package-comparison">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Package education</p>
          <h2>{packagesSection.title}</h2>
          <p>{packagesSection.subtitle}</p>
        </div>

        <div className={styles.packageGrid}>
          {plans.map((plan) => {
            const isFeatured = plan.isFeatured ?? plan.name === "Advanced";
            const included = packagesSection.features.filter((feature) => plan.includedFeatureIds.includes(feature.id)).slice(0, 6);
            return (
              <article key={plan.id} className={`${styles.packageCard} ${isFeatured ? styles.packageCardFeatured : ""}`.trim()}>
                <div className={styles.packageCardHeader}>
                  <span>{plan.badge || (isFeatured ? "Premium safety upgrade" : "Core safety upgrade")}</span>
                  {isFeatured ? <b>Most popular</b> : null}
                </div>

                <h3>{plan.name}</h3>
                <p className={styles.packageBestFor}>{plan.bestFor}</p>

                <div className={styles.packageVisual}>
                  {renderPackageDiagram(plan, isFeatured)}
                </div>

                <ul className={styles.packageFeatures}>
                  {included.map((feature) => (
                    <li key={`${plan.id}-${feature.id}`}>{feature.label}</li>
                  ))}
                </ul>

                <div className={styles.packageActions}>
                  <Link
                    href={packageDetailHref(plan.id)}
                    className={styles.packageDetailLink}
                    data-analytics-event="homepage_cta_click"
                    data-analytics-cta-location={`package-detail-${plan.id}`}
                    data-analytics-section="package-comparison"
                  >
                    View {plan.name} package
                  </Link>
                  <PackageCheckoutLink
                    href={packageCheckoutHref(plan.id)}
                    className={isFeatured ? styles.packageCheckoutFeatured : styles.packageCheckout}
                    entryPoint={isFeatured ? "homepage-package-advanced" : "homepage-package-standard"}
                    pageSection="package-comparison"
                    ctaId={`continue-${plan.id}`}
                    packageCode={plan.id}
                    packageName={plan.name}
                  >
                    Continue with {plan.name}
                  </PackageCheckoutLink>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.packageAssessmentNote}>
          <p>Not sure which package fits? Start with the free assessment and Mason will recommend the right scope.</p>
          <a
            href="#free-assessment"
            data-analytics-event="homepage_cta_click"
            data-analytics-cta-location="packages-assessment-note"
            data-analytics-section="package-comparison"
          >
            Book Free Safety Assessment
          </a>
        </div>
      </section>

      <section className={styles.processSection} id="how-it-works">
        <div className={styles.sectionHeader}>
          <p className={styles.eyebrow}>Our Process</p>
          <h2>{processSection.title}</h2>
          <p>{processSection.subtitle}</p>
        </div>

        <div className={styles.processTimeline}>
          {processSteps.map((step, index) => (
            <article key={step.id} className={styles.processStep}>
              <span>{formatStepNumber(index)}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>

        {processHighlights.length ? (
          <div className={styles.processHighlights}>
            {processHighlights.map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.doctorSection} id="doctor-reviewed">
        <div className={styles.doctorIntro}>
          <p className={styles.eyebrow}>Doctor-reviewed</p>
          <h2>{doctorsSection.title}</h2>
          <p>{doctorsSection.subtitle}</p>
        </div>

        <div className={styles.doctorNotice}>
          Both packages are planned around real bathroom movement and installed by trained Mason experts — the result feels safe, thoughtful, and
          beautifully at home.
        </div>

        <div className={styles.doctorGrid}>
          {doctors.map((doctor) => (
            <article key={doctor.id} className={styles.doctorCard}>
              <div className={styles.doctorMeta}>
                <div className={styles.doctorAvatar} aria-hidden="true">
                  Dr
                </div>
                <span>{doctor.registration}</span>
              </div>
              <h3>{doctor.doctorName}</h3>
              <p className={styles.doctorSpecialty}>{doctor.specialty}</p>
              <blockquote>“{doctor.quote}”</blockquote>
            </article>
          ))}
        </div>

        <p className={styles.doctorDisclaimer}>
          Doctor inputs are used for preventive safety planning and product approach. Mason Company does not provide medical treatment or guarantee
          fall-free outcomes.
        </p>
      </section>

      <section className={styles.faqSection} id="faq">
        <div className={styles.faqHeader}>
          <p className={styles.eyebrow}>Before you book</p>
          <h2>{faqSection.title}</h2>
          <p>{faqSection.subtitle}</p>
        </div>

        <div className={styles.faqList}>
          {faqItems.map((item, index) => (
            <details key={item.question} className={styles.faqItem} open={index === 0}>
              <summary>
                <span>{item.question}</span>
                <span className={styles.faqIcon} aria-hidden="true">
                  +
                </span>
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={styles.assessmentSection} id="free-assessment">
        <div className={styles.assessmentCopy}>
          <p className={styles.eyebrow}>Free safety assessment</p>
          <h2>Start with a Mason safety assessment.</h2>
          <p>
            Share a few details and Mason will contact you shortly to schedule a home visit or video assessment before you choose a package.
          </p>
          <div className={styles.assessmentTrust} aria-label="Assessment benefits">
            <span>No package selection required</span>
            <span>Home visit or video assessment</span>
            <span>No payment collected here</span>
          </div>
        </div>
        <div className={styles.assessmentFormCard}>
          <AssessmentLeadForm />
        </div>
      </section>

      <section className={styles.finalCtaSection}>
        <div>
          <h2>{finalCtaSection.title}</h2>
          <p>{finalCtaSection.subtitle}</p>
        </div>
        <a
          href="#free-assessment"
          className={styles.primaryButton}
          data-analytics-event="homepage_cta_click"
          data-analytics-cta-location="final-cta"
          data-analytics-section="final-cta"
        >
          {finalCtaSection.primaryCta}
        </a>
        <span>{brand.name}</span>
      </section>
    </main>
  );
}
