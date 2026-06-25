"use client";

import { useMemo, useState } from "react";
import { calculateRiskCostEstimator } from "../../content/evidence/evidence.logic";
import type { CostRangeMetric, EstimatorAssumption } from "../../content/evidence/types";

type EvidenceEstimatorProps = {
  assumptions: EstimatorAssumption[];
  inpatientRange?: CostRangeMetric;
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default function EvidenceEstimator({ assumptions, inpatientRange }: EvidenceEstimatorProps) {
  const defaultCost = Math.round((inpatientRange?.low ?? 10000) + (inpatientRange ? (inpatientRange.high - inpatientRange.low) / 2 : 7000));
  const minCost = Math.max(1000, Math.round((inpatientRange?.low ?? 5000) * 0.6));
  const maxCost = Math.max(minCost + 5000, Math.round((inpatientRange?.high ?? 40000) * 1.4));
  const [hasFallHistory, setHasFallHistory] = useState(false);
  const [needsSitStandSupport, setNeedsSitStandSupport] = useState(false);
  const [hasUnsupervisedUsage, setHasUnsupervisedUsage] = useState(false);
  const [baselineTreatmentCost, setBaselineTreatmentCost] = useState(defaultCost);

  const output = useMemo(
    () =>
      calculateRiskCostEstimator({
        hasFallHistory,
        needsSitStandSupport,
        hasUnsupervisedUsage,
        baselineTreatmentCost
      }),
    [baselineTreatmentCost, hasFallHistory, hasUnsupervisedUsage, needsSitStandSupport]
  );

  return (
    <section className="evidenceEstimator">
      <div className="evidenceEstimatorInputs">
        <h3>Risk-Cost Estimator</h3>
        <p>Use household context to estimate annual fall-related cost exposure range.</p>

        <label className="evidenceToggle">
          <input type="checkbox" checked={hasFallHistory} onChange={(event) => setHasFallHistory(event.target.checked)} />
          <span>Fall/slip incident in last 12 months</span>
        </label>

        <label className="evidenceToggle">
          <input
            type="checkbox"
            checked={needsSitStandSupport}
            onChange={(event) => setNeedsSitStandSupport(event.target.checked)}
          />
          <span>Needs support while sitting/standing</span>
        </label>

        <label className="evidenceToggle">
          <input type="checkbox" checked={hasUnsupervisedUsage} onChange={(event) => setHasUnsupervisedUsage(event.target.checked)} />
          <span>Frequent unsupervised bathroom usage</span>
        </label>

        <label className="evidenceInputField">
          <span>Expected per-event treatment cost (₹)</span>
          <input
            type="number"
            min={minCost}
            max={maxCost}
            step={500}
            value={baselineTreatmentCost}
            onChange={(event) => setBaselineTreatmentCost(Number(event.target.value) || minCost)}
          />
          <small>
            Range: {formatInr(minCost)} - {formatInr(maxCost)}
          </small>
        </label>
      </div>

      <div className="evidenceEstimatorOutput" aria-live="polite">
        <p className="estimatorScore">Risk score: {output.riskScore}/100</p>
        <p className="estimatorLine">
          Annual serious-fall probability range: <strong>{formatPercent(output.annualProbabilityLow)} - {formatPercent(output.annualProbabilityHigh)}</strong>
        </p>
        <p className="estimatorLine">
          Estimated annual treatment-cost exposure: <strong>{formatInr(output.annualExposureLow)} - {formatInr(output.annualExposureHigh)}</strong>
        </p>
        <p className="estimatorLine">
          Potential avoided exposure with home-risk reduction:{" "}
          <strong>{formatInr(output.potentialAvoidedLow)} - {formatInr(output.potentialAvoidedHigh)}</strong>
        </p>

        <div className="evidenceFormula">
          <p>Formula (transparent):</p>
          <pre>
            Annual Exposure = Treatment Cost x Annual Fall Probability
            {"\n"}Potential Avoided Exposure = Annual Exposure x Hazard Reduction Effect
          </pre>
        </div>

        <div className="evidenceAssumptions">
          <p>Assumptions used:</p>
          <ul>
            {assumptions.map((assumption) => (
              <li key={assumption.id}>
                {assumption.label}: default {assumption.defaultValue}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
