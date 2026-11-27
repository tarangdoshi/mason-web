import type { KeyboardEvent } from "react";
import { Newsreader } from "next/font/google";
import { cardBody, documentDensity, optionLine, type DocItem, type ProposalDoc } from "../../lib/proposals/document";
import { photoSources } from "../../lib/proposals/photos";
import styles from "./proposal-document.module.css";

// Newsreader with its optical-size axis, as in the approved design (display sizes use the finer display cut).
const display = Newsreader({ subsets: ["latin"], axes: ["opsz"], style: ["normal"], variable: "--font-proposal-display" });

/* The 3-page customer proposal (approved 20 Nov design, A4 794×1123 per page). Presentational only: the
   customer page, the staff "Show family" view and the browser PDF all render this one component.
   mode "screen" stacks/reflows pages on phones and scales them on small tablets; mode "a4" is always the
   fixed A4 layout (used for the PDF). */

export type ProposalOption = "essential" | "addon";

type Props = {
  doc: ProposalDoc;
  mode?: "screen" | "a4";
  chosen?: ProposalOption | null;
  onChoose?: (option: ProposalOption) => void;
  idPrefix?: string;
};

function Check() {
  return (
    <svg className={styles.check} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PageFooter({ doc, page }: { doc: ProposalDoc; page: number }) {
  return (
    <footer className={styles.footer}>
      <span>{doc.copy.footer || "masoncompany.in"}</span>
      <span>{page} of 3</span>
    </footer>
  );
}

function Header({ right, large }: { right: string; large?: boolean }) {
  return (
    <header className={styles.header} data-large={large ? "" : undefined}>
      <span className={styles.brand}>Mason Company</span>
      <span className={styles.headerRight}>{right}</span>
    </header>
  );
}

/** WebP where the browser declares it, JPEG otherwise (old Safari); the <picture> adds no box of its own. */
function ItemPhoto({ url }: { url: string }) {
  const { webp, jpeg } = photoSources(url);
  const img = <img className={styles.itemPhoto} src={jpeg} alt="" crossOrigin="anonymous" />;
  if (!webp) return img;
  return (
    <picture style={{ display: "contents" }}>
      <source type="image/webp" srcSet={webp} />
      {img}
    </picture>
  );
}

function ItemCards({ items, showQty }: { items: DocItem[]; showQty: "always" | "many" }) {
  return (
    <div className={styles.itemGrid} data-compact={showQty === "many" ? "" : undefined}>
      {items.map((item, index) => (
        <article
          key={item.key}
          className={styles.itemCard}
          data-wide={items.length % 2 === 1 && index === items.length - 1 ? "" : undefined}
          data-testid={`doc-item-${item.key}`}
        >
          {item.photoUrl ? (
            <ItemPhoto url={item.photoUrl} />
          ) : null}
          <div className={styles.itemText}>
            <div className={styles.itemHead}>
              <h3 className={styles.itemName}>{item.name}</h3>
              {item.complimentary ? <span className={styles.tag}>Complimentary</span> : null}
              {showQty === "always" || item.qty > 1 ? <span className={styles.qty}>× {item.qty}</span> : null}
            </div>
            {cardBody(item) ? <p className={styles.itemBody}>{cardBody(item)}</p> : null}
          </div>
        </article>
      ))}
    </div>
  );
}

/** Hidden sample using the document's fonts, so the PDF fonts can be captured before any proposal is shown. */
export function ProposalFontSample() {
  return (
    <div className={`${styles.doc} ${display.variable}`} data-mode="a4">
      <p className={styles.title}>Aa</p>
      <p className={styles.intro}>Aa <strong>Aa</strong></p>
    </div>
  );
}

export default function ProposalDocument({ doc, mode = "screen", chosen = null, onChoose, idPrefix = "proposal" }: Props) {
  const { copy } = doc;
  const options = copy.optionsPage;
  const interactive = Boolean(onChoose);
  const choose = (option: ProposalOption) => onChoose?.(option);
  const cardProps = (option: ProposalOption) =>
    interactive
      ? {
          role: "button" as const,
          tabIndex: 0,
          "aria-pressed": chosen === option,
          onClick: () => choose(option),
          onKeyDown: (event: KeyboardEvent) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              choose(option);
            }
          }
        }
      : {};
  const forLine = `For ${doc.customerName}`;
  const hasAddon = doc.addonPrice !== null;

  return (
    <div className={`${styles.doc} ${display.variable}`} data-mode={mode} data-density={documentDensity(doc)} data-testid={`${idPrefix}-document`}>
      {/* Page 1 · Your options */}
      <section className={styles.page} data-testid={`${idPrefix}-page-1`} aria-label="Page 1 of 3: your options">
        <Header right={options.headerLabel} large />
        <p className={styles.eyebrow} data-testid={`${idPrefix}-eyebrow`}>{options.eyebrow}</p>
        <h1 className={styles.title}>{options.title}</h1>
        <p className={styles.intro}>{options.intro}</p>
        {options.reassurances.length ? (
          <div className={styles.reassurances}>
            {options.reassurances.map((item) => (
              <div key={item.title}>
                <h2 className={styles.reassuranceTitle}>{item.title}</h2>
                {item.body ? <p className={styles.reassuranceBody}>{item.body}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
        <h2 className={styles.sectionHeading}>{options.sectionHeading}</h2>
        <div className={styles.options} data-single={hasAddon ? undefined : ""}>
          <div className={styles.optionCard} data-chosen={chosen === "essential" ? "" : undefined} data-testid={`${idPrefix}-option-essential`} {...cardProps("essential")}>
            <p className={styles.optionLabel}>{options.essentialOptionLabel}</p>
            <h3 className={styles.optionTitle}>{options.essentialTitle}</h3>
            <p className={styles.optionPrice}>{doc.essentialPrice}</p>
            <hr className={styles.rule} />
            <p className={styles.listLabel}>{options.whatYouGetLabel}</p>
            <ul className={styles.list}>
              {doc.essential.map((item) => (
                <li key={item.key}><Check />{optionLine(item)}</li>
              ))}
              {options.includedLines.map((line) => (
                <li key={line}><Check />{line}</li>
              ))}
              {doc.complimentary.map((item) => (
                <li key={item.key}>
                  <Check />
                  <span>{optionLine(item)} <span className={styles.tag}>{options.complimentaryLabel || "Complimentary"}</span></span>
                </li>
              ))}
            </ul>
          </div>
          {hasAddon ? (
            <div className={styles.optionCard} data-accent="" data-chosen={chosen === "addon" ? "" : undefined} data-testid={`${idPrefix}-option-addon`} {...cardProps("addon")}>
              <div className={styles.optionLabelRow}>
                <p className={styles.optionLabel}>{options.addonOptionLabel}</p>
                {options.addonBadge ? <span className={styles.badge}>{options.addonBadge}</span> : null}
              </div>
              <h3 className={styles.optionTitle}>{options.addonTitle}</h3>
              <p className={styles.optionPrice}>{doc.addonPrice}</p>
              <hr className={styles.rule} />
              <p className={styles.listLabel}>{options.whatYouGetLabel}</p>
              <ul className={styles.list}>
                <li><Check />{options.addonLead}</li>
                {/* No per-item prices for the add-on: it is one package. */}
                {doc.addon.map((item) => (
                  <li key={item.key}><Check />{optionLine(item)}</li>
                ))}
              </ul>
              {options.addonNote ? <p className={styles.optionNote}>{options.addonNote}</p> : null}
            </div>
          ) : null}
        </div>
        <PageFooter doc={doc} page={1} />
      </section>

      {/* Page 2 · Essential Package */}
      <section className={styles.page} data-testid={`${idPrefix}-page-2`} aria-label="Page 2 of 3: Essential Package">
        <Header right={forLine} />
        <div className={styles.partHead}>
          <div>
            <p className={styles.eyebrow} data-part="">{copy.essentialPage.eyebrow}</p>
            <h2 className={styles.partTitle}>{copy.essentialPage.title}</h2>
            <p className={styles.partIntro}>{copy.essentialPage.intro}</p>
          </div>
          <div className={styles.partPrice}>
            <p className={styles.bigPrice}>{doc.essentialPrice}</p>
            {copy.essentialPage.priceSuffix ? <p className={styles.priceSuffix}>{copy.essentialPage.priceSuffix}</p> : null}
          </div>
        </div>
        <ItemCards items={[...doc.essential, ...doc.complimentary]} showQty="always" />
        {copy.essentialPage.included.length ? (
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>{copy.essentialPage.includedHeading}</h3>
            <div className={styles.panelGrid}>
              {copy.essentialPage.included.map((item) => (
                <div key={item.title}>
                  <h4 className={styles.panelItemTitle}>{item.title}</h4>
                  {item.body ? <p className={styles.panelItemBody}>{item.body}</p> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <PageFooter doc={doc} page={2} />
      </section>

      {/* Page 3 · Add-on & next steps */}
      <section className={styles.page} data-testid={`${idPrefix}-page-3`} aria-label="Page 3 of 3: Add-on and next steps">
        <Header right={forLine} />
        {hasAddon ? (
          <>
            <p className={styles.eyebrow} data-part="">{copy.addonPage.eyebrow}</p>
            <h2 className={styles.partTitle}>{copy.addonPage.title}</h2>
            <p className={styles.partIntro} data-wide="">{copy.addonPage.intro}</p>
            <ItemCards items={doc.addon} showQty="many" />
            <div className={styles.priceStrip}>
              <div>
                <p className={styles.stripLabel}>{copy.addonPage.priceStripEssentialLabel}</p>
                <p className={styles.stripPrice}>{doc.essentialPrice}</p>
              </div>
              <div data-accent="">
                <p className={styles.stripLabel}>{copy.addonPage.priceStripAddonLabel}</p>
                <p className={styles.stripPrice}>{doc.addonPrice}</p>
              </div>
            </div>
          </>
        ) : null}
        <h2 className={styles.sectionHeading} data-tight={hasAddon ? "" : undefined}>What happens next</h2>
        <ol className={styles.steps}>
          {copy.whatHappensNext.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              {step.body ? <p className={styles.stepBody}>{step.body}</p> : null}
            </li>
          ))}
        </ol>
        <div className={styles.payment}>
          {copy.paymentTerms.map((term, index) => (
            <p key={index}>
              {index === 0 ? <strong>{copy.paymentHeading}. </strong> : null}
              {term}
            </p>
          ))}
        </div>
        {copy.closing ? <p className={styles.closing}>{copy.closing}</p> : null}
        {copy.signoff ? <p className={styles.signoff}>{copy.signoff}</p> : null}
        <p className={styles.disclaimer} data-testid={`${idPrefix}-disclaimer`}>{doc.disclaimer}</p>
        <PageFooter doc={doc} page={3} />
      </section>
    </div>
  );
}
