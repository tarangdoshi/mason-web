export type EvidenceScope = "INDIA" | "STATE" | "CITY" | "GLOBAL";

export type EvidenceQuality = "PRIMARY_GOV" | "PEER_REVIEWED" | "MULTILATERAL";

export type EvidenceConfidence = "HIGH" | "MEDIUM" | "LOW";

export interface EvidenceSource {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
  lastVerifiedAt: string;
  scope: EvidenceScope;
  quality: EvidenceQuality;
}

export interface EvidenceMetric {
  id: string;
  label: string;
  value: number;
  unit: string;
  population: string;
  region: string;
  year: string;
  sourceId: string;
  confidence: EvidenceConfidence;
}

export interface EvidenceClaim {
  id: string;
  statement: string;
  metricIds: string[];
  disclaimerIds: string[];
}

export interface CostRangeMetric {
  id: string;
  scenario: string;
  low: number;
  high: number;
  currency: string;
  sourceId: string;
}

export interface EstimatorAssumption {
  id: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  sourceId: string;
}

export interface RegionalEvidenceNote {
  region: string;
  note: string;
  sourceId: string;
}
