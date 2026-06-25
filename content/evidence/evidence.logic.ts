import {
  costRangeMetrics,
  estimatorAssumptions,
  evidenceClaims,
  evidenceMetrics,
  evidenceSources,
  regionalEvidenceNotes
} from "./evidence.content";
import type { EvidenceMetric, EvidenceSource } from "./types";

export type EstimatorInput = {
  hasFallHistory: boolean;
  needsSitStandSupport: boolean;
  hasUnsupervisedUsage: boolean;
  baselineTreatmentCost: number;
};

export type EstimatorOutput = {
  riskScore: number;
  annualProbabilityLow: number;
  annualProbabilityHigh: number;
  annualExposureLow: number;
  annualExposureHigh: number;
  potentialAvoidedLow: number;
  potentialAvoidedHigh: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getEvidenceSourceById(sourceId: string): EvidenceSource | undefined {
  return evidenceSources.find((source) => source.id === sourceId);
}

export function getEvidenceMetricById(metricId: string): EvidenceMetric | undefined {
  return evidenceMetrics.find((metric) => metric.id === metricId);
}

export function validateEvidenceMappings() {
  const sourceIds = new Set(evidenceSources.map((source) => source.id));
  const metricIds = new Set(evidenceMetrics.map((metric) => metric.id));

  const metricsWithoutSources = evidenceMetrics.filter((metric) => !sourceIds.has(metric.sourceId)).map((metric) => metric.id);
  const claimsWithMissingMetricIds = evidenceClaims
    .filter((claim) => claim.metricIds.some((metricId) => !metricIds.has(metricId)))
    .map((claim) => claim.id);
  const costRangesWithoutSources = costRangeMetrics
    .filter((range) => !sourceIds.has(range.sourceId))
    .map((range) => range.id);
  const assumptionsWithoutSources = estimatorAssumptions
    .filter((assumption) => !sourceIds.has(assumption.sourceId))
    .map((assumption) => assumption.id);
  const regionalNotesWithoutSources = regionalEvidenceNotes
    .filter((note) => !sourceIds.has(note.sourceId))
    .map((note) => note.region);

  return {
    metricsWithoutSources,
    claimsWithMissingMetricIds,
    costRangesWithoutSources,
    assumptionsWithoutSources,
    regionalNotesWithoutSources
  };
}

export function getRegionalEvidenceNote(region: string) {
  const normalized = region.trim().toLowerCase();
  const exact = regionalEvidenceNotes.find((item) => item.region.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }
  return regionalEvidenceNotes.find((item) => item.region === "India");
}

export function calculateRiskCostEstimator(input: EstimatorInput): EstimatorOutput {
  const baselineProbability = estimatorAssumptions.find((assumption) => assumption.id === "baseline-fall-probability")?.defaultValue ?? 0.12;
  const riskLiftFactor = estimatorAssumptions.find((assumption) => assumption.id === "risk-lift-factor")?.defaultValue ?? 0.18;
  const hazardReductionEffect =
    estimatorAssumptions.find((assumption) => assumption.id === "hazard-reduction-effect")?.defaultValue ?? 0.26;

  const riskContributors = [input.hasFallHistory, input.needsSitStandSupport, input.hasUnsupervisedUsage].filter(Boolean).length;
  const riskScore = clamp(Math.round((riskContributors / 3) * 100), 0, 100);

  const probabilityLift = riskContributors * (riskLiftFactor / 3);
  const annualProbabilityLow = clamp(baselineProbability + probabilityLift * 0.75, 0.03, 0.65);
  const annualProbabilityHigh = clamp(annualProbabilityLow + 0.12, annualProbabilityLow + 0.03, 0.8);

  const normalizedCost = clamp(input.baselineTreatmentCost, 1000, 500000);
  const annualExposureLow = Math.round(normalizedCost * annualProbabilityLow);
  const annualExposureHigh = Math.round(normalizedCost * annualProbabilityHigh);

  const potentialAvoidedLow = Math.round(annualExposureLow * hazardReductionEffect);
  const potentialAvoidedHigh = Math.round(annualExposureHigh * hazardReductionEffect);

  return {
    riskScore,
    annualProbabilityLow,
    annualProbabilityHigh,
    annualExposureLow,
    annualExposureHigh,
    potentialAvoidedLow,
    potentialAvoidedHigh
  };
}
