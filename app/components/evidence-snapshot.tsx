import type { EvidenceSectionContent } from "../../content/types";

type EvidenceSnapshotProps = {
  section: EvidenceSectionContent;
};

export default function EvidenceSnapshot({ section }: EvidenceSnapshotProps) {
  if (section.cards.length === 0) {
    return null;
  }

  return (
    <section className="sectionBlock sectionBand sectionBandNeutral evidenceSnapshotSection" id={section.id}>
      <div className="sectionBandInner">
        <div className="sectionHeader">
          <h2>{section.title}</h2>
          <p>{section.subtitle}</p>
        </div>
        <div className="evidenceSnapshot">
          {section.cards.map((card, index) => (
            <article
              key={card.id}
              className={`evidenceCard evidenceCardTone${index + 1}${index === 0 ? " evidenceCardPrimary" : ""}`}
            >
              <div className="evidenceCardTop">
                {card.kicker ? <p className="evidenceKicker">{card.kicker}</p> : null}
                <p className="evidenceValue">{card.value}</p>
              </div>
              <h3>{card.label}</h3>
              <p className="evidenceContext">{card.context}</p>
              <p className="evidenceSourceBadge">Source: {card.sourceLabel}</p>
              <a href={card.ctaHref} className="evidenceCardLink">
                {card.ctaLabel}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
