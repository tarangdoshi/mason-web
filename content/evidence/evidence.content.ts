import type {
  CostRangeMetric,
  EstimatorAssumption,
  EvidenceClaim,
  EvidenceMetric,
  EvidenceSource,
  RegionalEvidenceNote
} from "./types";

// Every figure below was checked against its source on 2026-10-06 (lastVerifiedAt). Figures that a
// source does not state exactly as written here must not be added; Mason-modelled numbers do not
// belong in this registry.
export const evidenceSources: EvidenceSource[] = [
  {
    id: "lasi-exec-2019",
    title: "Longitudinal Ageing Study in India (LASI) Wave 1 - India Executive Summary",
    url: "https://iipsindia.ac.in/sites/default/files/LASI_India_Executive_Summary_0.pdf",
    publisher: "International Institute for Population Sciences (IIPS), Mumbai",
    publishedAt: "2020",
    lastVerifiedAt: "2026-10-06",
    scope: "INDIA",
    quality: "PRIMARY_GOV"
  },
  {
    id: "lasi-fall-outcomes-2023",
    title: "Associations between intrinsic capacity, functional difficulty, and fall outcomes among older adults in India",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10276857/",
    publisher: "Scientific Reports (analysis of LASI Wave 1, 2017-18)",
    publishedAt: "2023",
    lastVerifiedAt: "2026-10-06",
    scope: "INDIA",
    quality: "PEER_REVIEWED"
  },
  {
    id: "india-fall-consequences-meta-2023",
    title: "Health Consequences of Falls among Older Adults in India: A Systematic Review and Meta-Analysis",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10137587/",
    publisher: "Geriatrics (peer-reviewed)",
    publishedAt: "2023",
    lastVerifiedAt: "2026-10-06",
    scope: "INDIA",
    quality: "PEER_REVIEWED"
  },
  {
    id: "bathroom-hazards-ahmedabad-2015",
    title: "Bathroom hazards among older adults in western India: a cross-sectional study",
    url: "https://researcher.manipal.edu/en/publications/bathroom-hazards-among-older-adults-in-western-india-a-cross-sect/",
    publisher: "Asian Journal of Gerontology and Geriatrics (peer-reviewed)",
    publishedAt: "2015",
    lastVerifiedAt: "2026-10-06",
    scope: "CITY",
    quality: "PEER_REVIEWED"
  },
  {
    id: "lasi-injury-cost-2024",
    title: "Falling and Injury Among Older Adults in India: Insights from the Longitudinal Ageing Study in India (LASI)",
    url: "https://www.mdpi.com/2313-576X/10/3/66",
    publisher: "Safety (MDPI, peer-reviewed)",
    publishedAt: "2024",
    lastVerifiedAt: "2026-03-06",
    scope: "INDIA",
    quality: "PEER_REVIEWED"
  },
  {
    id: "who-falls-factsheet",
    title: "WHO Falls - Fact Sheet",
    url: "https://www.who.int/news-room/fact-sheets/detail/falls",
    publisher: "World Health Organization",
    publishedAt: "2021",
    lastVerifiedAt: "2026-10-06",
    scope: "GLOBAL",
    quality: "MULTILATERAL"
  },
  {
    id: "cochrane-home-hazards-2023",
    title: "Environmental interventions for preventing falls in older people living in the community (Cochrane Review)",
    url: "https://doi.org/10.1002/14651858.CD013258.pub2",
    publisher: "Cochrane Database of Systematic Reviews",
    publishedAt: "2023",
    lastVerifiedAt: "2026-10-06",
    scope: "GLOBAL",
    quality: "PEER_REVIEWED"
  }
];

export const evidenceMetrics: EvidenceMetric[] = [
  {
    id: "india-older-adults-fall-2y",
    label: "Adults aged 60+ who reported a fall in the previous two years",
    value: 12.36,
    unit: "%",
    population: "Adults aged 60+",
    region: "India",
    year: "LASI Wave 1, 2017-18",
    sourceId: "lasi-fall-outcomes-2023",
    confidence: "HIGH"
  },
  {
    id: "india-older-adults-fall-injury-2y",
    label: "Adults aged 60+ who reported a fall-related injury in the previous two years",
    value: 5.57,
    unit: "%",
    population: "Adults aged 60+",
    region: "India",
    year: "LASI Wave 1, 2017-18",
    sourceId: "lasi-fall-outcomes-2023",
    confidence: "HIGH"
  },
  {
    id: "india-pooled-injury-after-fall-prevalence",
    label: "Older adults in India who were injured when they fell (pooled across studies; wide confidence interval)",
    value: 65.63,
    unit: "%",
    population: "Older adults who fell",
    region: "India",
    year: "Meta-analysis published 2023",
    sourceId: "india-fall-consequences-meta-2023",
    confidence: "MEDIUM"
  },
  {
    id: "bathrooms-without-grab-bars",
    label: "Bathrooms of older adults with no grab bars",
    value: 97,
    unit: "%",
    population: "198 community-dwelling adults aged 60+",
    region: "Ahmedabad",
    year: "Cross-sectional study, 2015",
    sourceId: "bathroom-hazards-ahmedabad-2015",
    confidence: "MEDIUM"
  },
  {
    id: "bathrooms-with-slippery-floor",
    label: "Bathrooms of older adults with a slippery floor",
    value: 91.9,
    unit: "%",
    population: "198 community-dwelling adults aged 60+",
    region: "Ahmedabad",
    year: "Cross-sectional study, 2015",
    sourceId: "bathroom-hazards-ahmedabad-2015",
    confidence: "MEDIUM"
  },
  {
    id: "bathrooms-with-poor-lighting",
    label: "Bathrooms of older adults with inadequate lighting",
    value: 94.4,
    unit: "%",
    population: "198 community-dwelling adults aged 60+",
    region: "Ahmedabad",
    year: "Cross-sectional study, 2015",
    sourceId: "bathroom-hazards-ahmedabad-2015",
    confidence: "MEDIUM"
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
    id: "global-fall-deaths-per-year",
    label: "Estimated fatal falls each year; adults over 60 suffer the greatest number",
    value: 684000,
    unit: "people",
    population: "All ages",
    region: "Global",
    year: "WHO fact sheet",
    sourceId: "who-falls-factsheet",
    confidence: "HIGH"
  },
  {
    id: "global-home-hazard-reduction-overall",
    label: "Reduction in the rate of falls from home fall-hazard programmes (all participants)",
    value: 26,
    unit: "%",
    population: "Older people living in the community (22 trials, 10 countries)",
    region: "Global evidence, mostly outside India",
    year: "Cochrane review 2023",
    sourceId: "cochrane-home-hazards-2023",
    confidence: "HIGH"
  },
  {
    id: "global-home-hazard-reduction-higher-risk",
    label: "Reduction in the rate of falls from home fall-hazard programmes (people at higher risk of falling)",
    value: 38,
    unit: "%",
    population: "Older people selected for higher falls risk",
    region: "Global evidence, mostly outside India",
    year: "Cochrane review 2023",
    sourceId: "cochrane-home-hazards-2023",
    confidence: "HIGH"
  }
];

export const evidenceClaims: EvidenceClaim[] = [
  {
    id: "claim-india-fall-burden",
    statement:
      "In India, about 1 in 8 adults aged 60 and over reported a fall in the two years before the national LASI survey, and across Indian studies most older adults who fell were injured.",
    metricIds: ["india-older-adults-fall-2y", "india-older-adults-fall-injury-2y", "india-pooled-injury-after-fall-prevalence"],
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
      "In randomised trials, mostly outside India, home fall-hazard programmes reduced the rate of falls by about a quarter overall and by more for people at higher risk of falling. The effect in any one home will vary.",
    metricIds: ["global-home-hazard-reduction-overall", "global-home-hazard-reduction-higher-risk"],
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
    sourceId: "india-fall-consequences-meta-2023"
  },
  {
    id: "hazard-reduction-effect",
    label: "Expected reduction from home hazard mitigation",
    defaultValue: 0.26,
    min: 0.1,
    max: 0.45,
    sourceId: "cochrane-home-hazards-2023"
  }
];

export const regionalEvidenceNotes: RegionalEvidenceNote[] = [
  {
    region: "Goa",
    note:
      "Goa-specific fall data is limited in published primary datasets, so Mason relies on India-level LASI and peer-reviewed estimates.",
    sourceId: "lasi-exec-2019"
  },
  {
    region: "India",
    note: "National-level LASI and peer-reviewed estimates are used as the current baseline evidence layer.",
    sourceId: "lasi-exec-2019"
  }
];
