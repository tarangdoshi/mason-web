import type {
  CostRangeMetric,
  EstimatorAssumption,
  EvidenceClaim,
  EvidenceMetric,
  EvidenceSource,
  RegionalEvidenceNote
} from "./types";

export const evidenceSources: EvidenceSource[] = [
  {
    id: "lasi-exec-2019",
    title: "Longitudinal Ageing Study in India (LASI) - India Executive Summary",
    url: "https://iipsindia.ac.in/sites/default/files/LASI_India_Executive_Summary_0.pdf",
    publisher: "International Institute for Population Sciences (IIPS), Mumbai",
    publishedAt: "2019-01-01",
    lastVerifiedAt: "2026-03-06",
    scope: "INDIA",
    quality: "PRIMARY_GOV"
  },
  {
    id: "injury-fall-meta-2024",
    title: "Injury and falls among older adults in India: a systematic review and meta-analysis",
    url: "https://pubmed.ncbi.nlm.nih.gov/41528689/",
    publisher: "Peer-reviewed publication indexed on PubMed",
    publishedAt: "2024-09-14",
    lastVerifiedAt: "2026-03-06",
    scope: "INDIA",
    quality: "PEER_REVIEWED"
  },
  {
    id: "lasi-injury-cost-2024",
    title: "Falling and Injury Among Older Adults in India: Insights from the Longitudinal Ageing Study in India (LASI)",
    url: "https://www.mdpi.com/2313-576X/10/3/66",
    publisher: "MDPI (Safety Journal)",
    publishedAt: "2024-08-13",
    lastVerifiedAt: "2026-03-06",
    scope: "INDIA",
    quality: "PEER_REVIEWED"
  },
  {
    id: "who-falls-factsheet",
    title: "WHO Falls - Fact Sheet",
    url: "https://www.who.int/news-room/fact-sheets/detail/falls",
    publisher: "World Health Organization",
    publishedAt: "2021-04-26",
    lastVerifiedAt: "2026-03-06",
    scope: "GLOBAL",
    quality: "MULTILATERAL"
  },
  {
    id: "cochrane-home-hazards-2021",
    title: "Cochrane review summary: reducing trip hazards and decluttering can prevent falls among older people",
    url: "https://www.cochrane.org/about-us/news/cochrane-review-shows-reducing-trip-hazards-and-decluttering-can-prevent-falls-among-older",
    publisher: "Cochrane",
    publishedAt: "2021-08-31",
    lastVerifiedAt: "2026-03-06",
    scope: "GLOBAL",
    quality: "PEER_REVIEWED"
  }
];

export const evidenceMetrics: EvidenceMetric[] = [
  {
    id: "india-older-adults-fall-or-injury-2y",
    label: "Older adults (60+) reporting injury and/or fall in last two years",
    value: 25,
    unit: "%",
    population: "Adults aged 60+",
    region: "India",
    year: "2017-2018 LASI Wave 1",
    sourceId: "lasi-exec-2019",
    confidence: "HIGH"
  },
  {
    id: "india-pooled-injury-after-fall-prevalence",
    label: "Pooled prevalence of injury among older adults with falls",
    value: 65.63,
    unit: "%",
    population: "Older adults with falls",
    region: "India",
    year: "Meta-analysis published 2024",
    sourceId: "injury-fall-meta-2024",
    confidence: "HIGH"
  },
  {
    id: "india-injury-inpatient-oope-public",
    label: "Mean annual out-of-pocket cost for injury-related inpatient treatment (public hospital)",
    value: 10727,
    unit: "INR",
    population: "Older adults with injury treatment",
    region: "India",
    year: "LASI analytical publication 2024",
    sourceId: "lasi-injury-cost-2024",
    confidence: "MEDIUM"
  },
  {
    id: "india-injury-inpatient-oope-private",
    label: "Mean annual out-of-pocket cost for injury-related inpatient treatment (private hospital)",
    value: 29747,
    unit: "INR",
    population: "Older adults with injury treatment",
    region: "India",
    year: "LASI analytical publication 2024",
    sourceId: "lasi-injury-cost-2024",
    confidence: "MEDIUM"
  },
  {
    id: "india-injury-outpatient-oope-public",
    label: "Mean annual out-of-pocket cost for injury-related outpatient treatment (public facility)",
    value: 669,
    unit: "INR",
    population: "Older adults with injury treatment",
    region: "India",
    year: "LASI analytical publication 2024",
    sourceId: "lasi-injury-cost-2024",
    confidence: "MEDIUM"
  },
  {
    id: "india-injury-outpatient-oope-private",
    label: "Mean annual out-of-pocket cost for injury-related outpatient treatment (private facility)",
    value: 1404,
    unit: "INR",
    population: "Older adults with injury treatment",
    region: "India",
    year: "LASI analytical publication 2024",
    sourceId: "lasi-injury-cost-2024",
    confidence: "MEDIUM"
  },
  {
    id: "india-lifetime-spend-proxy-after-fall-10y",
    label: "Modeled lifetime spend proxy after serious injury event (10-year horizon)",
    value: 297470,
    unit: "INR",
    population: "Older adults with serious injury treatment (modeled proxy)",
    region: "India",
    year: "Derived from LASI analytical publication 2024",
    sourceId: "lasi-injury-cost-2024",
    confidence: "LOW"
  },
  {
    id: "global-fall-deaths-per-year",
    label: "Estimated annual fall-related deaths",
    value: 684000,
    unit: "people",
    population: "All age groups",
    region: "Global",
    year: "WHO fact sheet",
    sourceId: "who-falls-factsheet",
    confidence: "HIGH"
  },
  {
    id: "global-home-hazard-reduction-effect",
    label: "Estimated fall reduction from home hazard reduction in higher-risk groups",
    value: 26,
    unit: "%",
    population: "Older adults at higher risk of falls",
    region: "Global evidence",
    year: "Cochrane review summary 2021",
    sourceId: "cochrane-home-hazards-2021",
    confidence: "MEDIUM"
  }
];

export const evidenceClaims: EvidenceClaim[] = [
  {
    id: "claim-india-fall-burden",
    statement:
      "India-level ageing data indicates meaningful fall/injury burden in households with older adults, supporting proactive home-safety interventions.",
    metricIds: ["india-older-adults-fall-or-injury-2y", "india-pooled-injury-after-fall-prevalence"],
    disclaimerIds: ["medicalDisclaimer", "outcomeDisclaimer"]
  },
  {
    id: "claim-treatment-cost-burden",
    statement:
      "Injury treatment can create significant out-of-pocket burden, especially in private inpatient settings, which affects family financial planning.",
    metricIds: ["india-injury-inpatient-oope-public", "india-injury-inpatient-oope-private"],
    disclaimerIds: ["outcomeDisclaimer"]
  },
  {
    id: "claim-prevention-effect-direction",
    statement:
      "Evidence suggests targeted home hazard reduction can lower falls in higher-risk groups, though impact varies by household and individual mobility.",
    metricIds: ["global-home-hazard-reduction-effect"],
    disclaimerIds: ["medicalDisclaimer", "outcomeDisclaimer"]
  }
];

export const costRangeMetrics: CostRangeMetric[] = [
  {
    id: "cost-range-inpatient",
    scenario: "Injury-related inpatient treatment cost range (public to private)",
    low: 10727,
    high: 29747,
    currency: "INR",
    sourceId: "lasi-injury-cost-2024"
  },
  {
    id: "cost-range-outpatient",
    scenario: "Injury-related outpatient treatment cost range (public to private)",
    low: 669,
    high: 1404,
    currency: "INR",
    sourceId: "lasi-injury-cost-2024"
  }
];

export const estimatorAssumptions: EstimatorAssumption[] = [
  {
    id: "baseline-fall-probability",
    label: "Baseline annual serious-fall probability proxy",
    defaultValue: 0.12,
    min: 0.05,
    max: 0.35,
    sourceId: "lasi-exec-2019"
  },
  {
    id: "risk-lift-factor",
    label: "Risk-lift when household reports higher mobility risk factors",
    defaultValue: 0.18,
    min: 0.05,
    max: 0.4,
    sourceId: "injury-fall-meta-2024"
  },
  {
    id: "hazard-reduction-effect",
    label: "Expected reduction from home hazard mitigation",
    defaultValue: 0.26,
    min: 0.1,
    max: 0.45,
    sourceId: "cochrane-home-hazards-2021"
  }
];

export const regionalEvidenceNotes: RegionalEvidenceNote[] = [
  {
    region: "Mumbai",
    note:
      "City-level fall-cost series is limited in currently published primary datasets; Mason Company uses India-level LASI and peer-reviewed estimates until stronger city data is available.",
    sourceId: "lasi-exec-2019"
  },
  {
    region: "Goa",
    note:
      "City-level fall-cost series is limited in currently published primary datasets; Mason Company uses India-level LASI and peer-reviewed estimates until stronger city data is available.",
    sourceId: "lasi-exec-2019"
  },
  {
    region: "India",
    note: "National-level LASI and peer-reviewed estimates are used as the current baseline evidence layer.",
    sourceId: "lasi-exec-2019"
  }
];
