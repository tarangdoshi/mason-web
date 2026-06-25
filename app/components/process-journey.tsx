import type { ProcessStepBadge, ProcessStepContent } from "../../content/types";

type ProcessJourneyProps = {
  steps: ProcessStepContent[];
  fallbackImages: readonly string[];
  disclosure: string;
};

const badgeLabel: Record<ProcessStepBadge, string> = {
  MANDATORY: "Mandatory",
  INCLUDED: "Included",
  ADD_ON: "Add-on"
};

const badgeClass: Record<ProcessStepBadge, string> = {
  MANDATORY: "processTimelineBadgeMandatory",
  INCLUDED: "processTimelineBadgeIncluded",
  ADD_ON: "processTimelineBadgeAddon"
};

export default function ProcessJourney({ steps, fallbackImages, disclosure }: ProcessJourneyProps) {
  const defaultProcessImage = fallbackImages[0] || "/images/hero/normal-bathroom.jpg";

  return (
    <>
      <ol className="processTimeline" aria-label="Aegis process timeline">
        {steps.map((step, index) => (
          <li key={step.id} className="processTimelineItem">
            <article className="processTimelineCard">
              <div className="processTimelineTop">
                <span className="processTimelineStepNo">Step {index + 1}</span>
                <span className={`processTimelineBadge ${badgeClass[step.badge]}`}>{badgeLabel[step.badge]}</span>
              </div>
              <div className="processTimelineMediaWrap">
                <img
                  src={step.icon || fallbackImages[index] || defaultProcessImage}
                  alt={step.alt}
                  loading="lazy"
                  className="processTimelineImage"
                />
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          </li>
        ))}
      </ol>
      <p className="processDisclosure">{disclosure}</p>
    </>
  );
}
