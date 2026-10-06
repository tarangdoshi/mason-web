import type { Metadata } from "next";
import Link from "next/link";
import SourceTable from "../../components/source-table";
import { complianceLibrary } from "../../../content/communications/compliance";
import {
  costRangeMetrics,
  evidenceClaims,
  evidenceMetrics,
  evidenceSources,
  regionalEvidenceNotes
} from "../../../content/evidence/evidence.content";
import { getEvidenceMetricById, getEvidenceSourceById, validateEvidenceMappings } from "../../../content/evidence/evidence.logic";

export const metadata: Metadata = {
  alternates: { canonical: "/evidence" },
  title: "Falls, Injury Risk and Treatment-Cost Evidence for Families | Mason Company",
  description: "India-first evidence on falls and injuries among older adults, with links to the published sources."
};

function formatMetricValue(value: number, unit: string) {
  if (unit === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  }
  if (unit === "%") {
    return `${value}%`;
  }
  return `${value.toLocaleString("en-IN")} ${unit}`;
}

export default function EvidencePage() {
  const mappingValidation = validateEvidenceMappings();
  const inpatientRange = costRangeMetrics.find((range) => range.id === "cost-range-inpatient");
  const outpatientRange = costRangeMetrics.find((range) => range.id === "cost-range-outpatient");

  return (
    <main className="page themeWarm evidencePage">
      <section className="sectionBlock evidenceHero">
        <p className="eyebrow">Mason Company evidence</p>
        <h1>Falls, injury risk, and treatment-cost evidence for families</h1>
        <p className="evidenceLead">
          This page summarizes India-first evidence on falls and injuries among older adults. Published figures link to
          their sources; derived estimates show their calculation.
        </p>
        <div className="ctaRow">
          <Link href="/" className="commsBackLink">
            Back to Homepage
          </Link>
          <a href="/compare-packages#packages" className="secondaryCta commsAnchorButton">
            Compare Packages
          </a>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>What the data says</h2>
          <p>India-first burden indicators on fall risk and injury outcomes for older adults.</p>
        </div>
        <div className="evidenceMetricGrid">
          {evidenceMetrics
            .filter((metric) =>
              [
                "india-older-adults-fall-2y",
                "india-older-adults-fall-injury-2y",
                "india-pooled-injury-after-fall-prevalence"
              ].includes(metric.id)
            )
            .map((metric) => {
              const source = getEvidenceSourceById(metric.sourceId);
              return (
                <article key={metric.id} className="evidenceMetricCard">
                  <p className="evidenceMetricValue">{formatMetricValue(metric.value, metric.unit)}</p>
                  <h3>{metric.label}</h3>
                  <p className="evidenceMetricMeta">
                    {metric.population} • {metric.region} • {metric.year}
                  </p>
                  {source ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className="evidenceMetricSource">
                      Source: {source.publisher}
                    </a>
                  ) : null}
                </article>
              );
            })}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>What older adults&rsquo; bathrooms in India look like</h2>
          <p>
            A study of 198 bathrooms used by adults aged 60+ in Ahmedabad found most had several hazards at once. Every
            bathroom had at least seven.
          </p>
        </div>
        <div className="evidenceMetricGrid">
          {evidenceMetrics
            .filter((metric) => ["bathrooms-without-grab-bars", "bathrooms-with-slippery-floor", "bathrooms-with-poor-lighting"].includes(metric.id))
            .map((metric) => {
              const source = getEvidenceSourceById(metric.sourceId);
              return (
                <article key={metric.id} className="evidenceMetricCard">
                  <p className="evidenceMetricValue">{formatMetricValue(metric.value, metric.unit)}</p>
                  <h3>{metric.label}</h3>
                  <p className="evidenceMetricMeta">
                    {metric.population} • {metric.region} • {metric.year}
                  </p>
                  {source ? (
                    <a href={source.url} target="_blank" rel="noreferrer" className="evidenceMetricSource">
                      Source: {source.publisher}
                    </a>
                  ) : null}
                </article>
              );
            })}
        </div>
      </section>

      <section className="sectionBlock sectionMuted">
        <div className="sectionHeader">
          <h2>Financial impact</h2>
          <p>Observed out-of-pocket treatment burden from India evidence (public and private pathways).</p>
        </div>
        <div className="evidenceMetricGrid">
          {evidenceMetrics
            .filter((metric) =>
              [
                "india-injury-inpatient-oope-public",
                "india-injury-inpatient-oope-private",
                "india-injury-outpatient-oope-public",
                "india-injury-outpatient-oope-private"
              ].includes(metric.id)
            )
            .map((metric) => (
              <article key={metric.id} className="evidenceMetricCard">
                <p className="evidenceMetricValue">{formatMetricValue(metric.value, metric.unit)}</p>
                <h3>{metric.label}</h3>
                <p className="evidenceMetricMeta">
                  {metric.population} • {metric.region}
                </p>
                <a
                  href={getEvidenceSourceById(metric.sourceId)?.url}
                  target="_blank"
                  rel="noreferrer"
                  className="evidenceMetricSource"
                >
                  Source: LASI analytical paper
                </a>
              </article>
            ))}
        </div>
        <div className="evidenceCostRanges">
          {inpatientRange ? (
            <p>
              Inpatient treatment range: <strong>{formatMetricValue(inpatientRange.low, "INR")}</strong> to{" "}
              <strong>{formatMetricValue(inpatientRange.high, "INR")}</strong>
            </p>
          ) : null}
          {outpatientRange ? (
            <p>
              Outpatient treatment range: <strong>{formatMetricValue(outpatientRange.low, "INR")}</strong> to{" "}
              <strong>{formatMetricValue(outpatientRange.high, "INR")}</strong>
            </p>
          ) : null}
          <p>
            These are average annual out-of-pocket amounts reported in the cited LASI analysis, not the cost of any single fall.
          </p>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>Prevention evidence</h2>
          <p>Direction-of-impact evidence for home hazard reduction in higher-risk older adults.</p>
        </div>
        <div className="evidenceClaims">
          {evidenceClaims.map((claim) => (
            <article key={claim.id} className="evidenceClaimCard">
              <p>{claim.statement}</p>
              <ul>
                {claim.metricIds.map((metricId) => {
                  const metric = getEvidenceMetricById(metricId);
                  if (!metric) {
                    return null;
                  }
                  return (
                    <li key={metricId}>
                      {metric.label}: <strong>{formatMetricValue(metric.value, metric.unit)}</strong> ({metric.region})
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
        <p className="evidenceDisclaimer">{complianceLibrary.outcomeDisclaimer}</p>
      </section>

      <section className="sectionBlock sectionOutline">
        <div className="sectionHeader">
          <h2>Regional context</h2>
          <p>Regional notes with India/state fallback when city-series data is sparse.</p>
        </div>
        <div className="regionalEvidenceGrid">
          {regionalEvidenceNotes.map((note) => {
            const source = getEvidenceSourceById(note.sourceId);
            return (
              <article key={note.region} className="regionalEvidenceCard">
                <h3>{note.region}</h3>
                <p>{note.note}</p>
                {source ? (
                  <a href={source.url} target="_blank" rel="noreferrer">
                    Source: {source.publisher}
                  </a>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="sectionBlock sectionMuted">
        <div className="sectionHeader">
          <h2>What this means for your parent&rsquo;s bathroom</h2>
          <p>
            Population figures show the size of the risk; they cannot tell you what is risky in one particular home. That
            is what an assessment is for.
          </p>
        </div>
        <ul className="evidenceNextSteps">
          <li>
            <Link href="/bathroom-safety-assessment">How a Mason bathroom safety assessment works in Goa</Link>
          </li>
          <li>
            <Link href="/guides/bathroom-safety-for-elderly-parents">What to check in an elderly parent&rsquo;s bathroom</Link>
          </li>
          <li>
            <Link href="/packages">Standard and Advanced packages</Link>
          </li>
        </ul>
        <p className="evidenceDisclaimer">{complianceLibrary.medicalDisclaimer}</p>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>Method &amp; Sources</h2>
          <p>Primary-source registry and verification metadata.</p>
        </div>
        <SourceTable sources={evidenceSources} />
        <div className="evidenceIntegrity">
          <p>Integrity checks:</p>
          <ul>
            <li>Metrics without source IDs: {mappingValidation.metricsWithoutSources.length}</li>
            <li>Claims with missing metric IDs: {mappingValidation.claimsWithMissingMetricIds.length}</li>
            <li>Cost ranges without source IDs: {mappingValidation.costRangesWithoutSources.length}</li>
            <li>Assumptions without source IDs: {mappingValidation.assumptionsWithoutSources.length}</li>
            <li>Regional notes without source IDs: {mappingValidation.regionalNotesWithoutSources.length}</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
