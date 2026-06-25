import type {
  CertificationStatus,
  FieldAuditChecklist,
  HiringAssessmentScore,
  StartupFieldSop,
  TechnicianCandidateProfile,
  TechnicianReadinessProgram,
  TrainingProgressRecord
} from "./types";

export const startupFieldSop: StartupFieldSop = {
  title: "Startup Field SOP",
  summary:
    "Short must-follow workflow for live Aegis jobs. This is the operating default for an early-stage team and covers only the non-negotiable field controls.",
  steps: [
    {
      id: "pre-visit-confirmation",
      title: "Pre-visit confirmation",
      mustDo: [
        "Confirm visit slot, address, package scope, and who will be present on-site.",
        "Confirm technician kit readiness before leaving for the job.",
        "Call the customer before arrival to reduce no-shows and confusion."
      ]
    },
    {
      id: "arrival-and-otp",
      title: "Arrival and identity / OTP check",
      mustDo: [
        "Introduce yourself clearly and show technician identity.",
        "Complete arrival OTP or approved arrival verification before starting work.",
        "Do not begin installation until arrival verification is complete."
      ]
    },
    {
      id: "site-inspection",
      title: "Bathroom safety inspection before work starts",
      mustDo: [
        "Check wall condition, installable surfaces, water exposure, and movement zones.",
        "Confirm the planned placement is safe and practical for the elder's movement.",
        "Escalate before work starts if the planned solution cannot be installed safely."
      ]
    },
    {
      id: "installation-checks",
      title: "Installation and placement checks",
      mustDo: [
        "Install only the approved scope and use safe anchoring / fitting methods.",
        "Check alignment, stability, finish quality, and that no sharp edges or new hazards are introduced.",
        "Keep the site controlled and clean during work."
      ]
    },
    {
      id: "proof-capture",
      title: "Photo and documentation proof",
      mustDo: [
        "Capture clear before/after photos of the completed work.",
        "Record what was installed and note any deviation from the original plan.",
        "Make sure proof is saved before asking for job closure."
      ]
    },
    {
      id: "closure-and-payment",
      title: "Completion OTP, handover, and payment confirmation",
      mustDo: [
        "Do a short walkthrough with the elder or family and explain safe usage.",
        "Complete completion OTP or approved closure verification before leaving.",
        "Capture payment mode and payment proof accurately for every paid job."
      ]
    }
  ],
  escalationTriggers: [
    "Unsafe wall, surface, or fixing condition",
    "Mismatch between planned solution and what is safely installable on-site",
    "Customer asks for work outside approved package scope",
    "Arrival/completion OTP cannot be completed correctly",
    "Payment mismatch or payment proof cannot be captured",
    "Any situation where safe completion is not possible"
  ],
  defaults: [
    "Doctor review is not a mandatory standard step in this startup SOP.",
    "This SOP is the live-job default; the detailed readiness program remains a scale-up reference.",
    "If there is any doubt about safety, stop work and escalate rather than improvising on-site."
  ]
};

export const technicianReadinessProgram: TechnicianReadinessProgram = {
  title: "Mason Company Technician Readiness Plan",
  markets: ["Mumbai", "Goa"],
  operatingLanguageBaseline: ["English", "Hindi"],
  optionalLanguagePreference: ["Marathi", "Konkani"],
  scorecardDomains: [
    {
      id: "installation-quality",
      domain: "Installation quality (grab bars, raised seat, anti-slip)",
      weight: 35,
      testMethod: "Practical install on mock setup",
      minimumGate: 3
    },
    {
      id: "safety-geriatric",
      domain: "Safety + geriatric sensitivity",
      weight: 20,
      testMethod: "Risk spotting, placement logic, dignity handling",
      minimumGate: 3
    },
    {
      id: "customer-communication",
      domain: "Customer communication",
      weight: 20,
      testMethod: "Role-play with buyer and elder",
      minimumGate: 3
    },
    {
      id: "sop-discipline",
      domain: "SOP discipline (OTP, checklist, documentation)",
      weight: 15,
      testMethod: "Process simulation",
      minimumGate: 3
    },
    {
      id: "digital-fluency",
      domain: "Digital fluency (CRM/app/payment capture)",
      weight: 10,
      testMethod: "App workflow execution",
      minimumGate: 3
    }
  ],
  passRules: [
    { id: "pass-1", rule: "Weighted score must be >= 75/100." },
    { id: "pass-2", rule: "No scorecard domain can be below 3/5." },
    { id: "pass-3", rule: "Any safety breach or OTP breach causes automatic failure." }
  ],
  practicalHiringTests: [
    {
      id: "test-mock-install",
      name: "Mock installation test",
      durationMinutes: 45,
      objective: "Validate installation quality and technical discipline.",
      successCriteria: [
        "Accurate wall marking by use zone",
        "Correct anchor depth and load stability",
        "Clean finish quality with no sharp edges",
        "Post-install stability verification completed"
      ]
    },
    {
      id: "test-risk-audit",
      name: "Risk audit test",
      durationMinutes: 20,
      objective: "Validate risk recognition and mitigation judgment.",
      successCriteria: [
        "Identify at least 8 out of 10 hazards",
        "Explain why each hazard matters",
        "Propose feasible placement and mitigation action"
      ]
    },
    {
      id: "test-communication-roleplay",
      name: "Communication role-play",
      durationMinutes: 15,
      objective: "Assess dignity-first customer communication.",
      successCriteria: [
        "Explains outcomes without age-shaming language",
        "Handles objections calmly and clearly",
        "Uses family-protection framing with conservative claims"
      ]
    },
    {
      id: "test-digital-drill",
      name: "Digital process drill",
      durationMinutes: 15,
      objective: "Assess execution of required digital workflow.",
      successCriteria: [
        "Updates order status correctly in app",
        "Runs arrival and completion OTP flow correctly",
        "Records UPI/POS/Cash payment proof without errors"
      ]
    }
  ],
  trainingCurriculum: [
    {
      day: 1,
      topic: "Mason Company service model, brand behavior, dignity-first communication",
      outcome: "Technician understands package-first model and customer behavior standards."
    },
    {
      day: 2,
      topic: "Bathroom fall-risk fundamentals and movement support principles",
      outcome: "Technician can identify high-risk movement zones and support needs."
    },
    {
      day: 3,
      topic: "Tools, materials, wall types, anchoring science",
      outcome: "Technician can choose suitable tools and anchor methods by wall type."
    },
    {
      day: 4,
      topic: "Grab bar placement standards by use-zone",
      outcome: "Technician can map and justify placement for practical daily movement."
    },
    {
      day: 5,
      topic: "Raised seat and support accessory installation",
      outcome: "Technician can install support accessories to specification."
    },
    {
      day: 6,
      topic: "Anti-slip application methods and surface prep",
      outcome: "Technician can prepare surfaces and apply anti-slip safely and evenly."
    },
    {
      day: 7,
      topic: "SOP day: arrival OTP, completion OTP, documentation",
      outcome: "Technician can execute full SOP without missed checkpoints."
    },
    {
      day: 8,
      topic: "CRM/app workflow and payment capture (UPI/POS/Cash)",
      outcome: "Technician can close jobs with clean digital and payment records."
    },
    {
      day: 9,
      topic: "Customer objection handling and escalation protocol",
      outcome: "Technician can handle concerns and escalate correctly when needed."
    },
    {
      day: 10,
      topic: "Doctor-attestation context and compliant claims language",
      outcome: "Technician can explain attestation context without medical over-claiming."
    },
    {
      day: 11,
      topic: "Supervised field shadow (2 jobs)",
      outcome: "Technician observes real workflows and audit expectations."
    },
    {
      day: 12,
      topic: "Assisted installation (technician leads, trainer audits)",
      outcome: "Technician leads installation under live supervision."
    },
    {
      day: 13,
      topic: "Final practical exam and written SOP check",
      outcome: "Technician passes technical and process certification gates."
    },
    {
      day: 14,
      topic: "Certification board and deployment tiering (L1/L2)",
      outcome: "Technician is assigned deployable status and tier."
    }
  ],
  fieldQaChecklist: [
    {
      id: "qa-previsit",
      title: "Pre-visit readiness",
      verification: "Slot adherence, kit readiness, and customer pre-call completed."
    },
    {
      id: "qa-arrival",
      title: "Arrival security",
      verification: "ID shown and arrival OTP verified correctly."
    },
    {
      id: "qa-inspection",
      title: "Inspection quality",
      verification: "Risk points logged with placement rationale."
    },
    {
      id: "qa-installation",
      title: "Installation quality",
      verification: "Alignment, load stability, finish quality, no sharp edges."
    },
    {
      id: "qa-hygiene",
      title: "Hygiene and hazard control",
      verification: "Site cleaned, debris removed, no new hazard introduced."
    },
    {
      id: "qa-completion",
      title: "Completion security",
      verification: "Walkthrough completed and completion OTP verified."
    },
    {
      id: "qa-payment",
      title: "Payment accuracy",
      verification: "Payment mode and proof captured correctly."
    },
    {
      id: "qa-handover",
      title: "Handover quality",
      verification: "Usage guidance explained clearly to elder and family."
    },
    {
      id: "qa-support",
      title: "Support clarity",
      verification: "Grievance path and support contacts explained."
    }
  ],
  fieldQaScoringRules: [
    "Each QA item is scored from 0 to 2.",
    "Target score is >= 16 out of 18 per job.",
    "First 30 jobs per technician must be 100 percent audited."
  ],
  criticalFailureTriggers: [
    "Incorrect anchoring that compromises load stability",
    "Arrival or completion OTP misuse",
    "Payment mismatch or proof capture failure"
  ],
  pilotRollout: [
    {
      week: 1,
      milestone: "Hire and assess initial technician cohort",
      target: "Assess first 10 candidates with scorecard and practical tests"
    },
    {
      week: 2,
      milestone: "Training phase part 1",
      target: "Complete days 1 to 7 for full cohort"
    },
    {
      week: 3,
      milestone: "Training phase part 2 and certification",
      target: "Complete days 8 to 14 and assign L1 or L2 deployment tier"
    },
    {
      week: 4,
      milestone: "Soft launch with strict audit",
      target: "Run 100 percent QA coverage on first 30 jobs per technician"
    }
  ],
  testScenarios: [
    {
      id: "scenario-communication-fail",
      scenario: "Technician passes technical tests but fails dignity communication.",
      action: "Do not deploy; assign communication retraining and re-test."
    },
    {
      id: "scenario-digital-gap",
      scenario: "Technician passes all tests except digital workflow.",
      action: "Mark restricted deployment; allow field work only after digital re-certification."
    },
    {
      id: "scenario-otp-repeat-error",
      scenario: "Repeated OTP error in field jobs.",
      action: "Immediate suspension and mandatory re-certification before redeployment."
    },
    {
      id: "scenario-fit-complaint",
      scenario: "Customer raises fit or stability complaint post-installation.",
      action: "Trigger rework SLA and QA root-cause review."
    }
  ],
  acceptanceCriteria: [
    "Every deployed technician has a recorded hiring scorecard and certification status.",
    "First 30 jobs per technician have completed QA checklists.",
    "Critical failures are tracked with documented corrective action.",
    "Customer communication remains compliant and dignity-first."
  ],
  assumptions: [
    "English and Hindi are mandatory operating languages in phase one.",
    "Marathi and Konkani are preferred where market and hiring pool allow.",
    "Mason Company uses own technicians only with no third-party installer model.",
    "Pay-scale and incentive design are managed separately from readiness operations."
  ]
};

export const sampleCandidateProfiles: TechnicianCandidateProfile[] = [
  {
    name: "Rohit Patil",
    city: "Mumbai",
    languages: ["English", "Hindi", "Marathi"],
    experience_years: 4,
    background_verified: true
  },
  {
    name: "Nikhil D'Souza",
    city: "Goa",
    languages: ["English", "Hindi", "Konkani"],
    experience_years: 3,
    background_verified: true
  }
];

export const sampleHiringScores: HiringAssessmentScore[] = [
  {
    candidate_id: "cand-001",
    technical_score: 4,
    safety_score: 4,
    communication_score: 3,
    sop_score: 4,
    digital_score: 3,
    total_weighted_score: 78,
    status: "PASS"
  },
  {
    candidate_id: "cand-002",
    technical_score: 4,
    safety_score: 2,
    communication_score: 4,
    sop_score: 3,
    digital_score: 4,
    total_weighted_score: 70,
    status: "FAIL"
  }
];

export const sampleTrainingRecords: TrainingProgressRecord[] = [
  {
    technician_id: "tech-001",
    day_completed: 7,
    trainer_id: "trainer-01",
    module_status: "COMPLETED",
    module_name: "SOP day: arrival OTP, completion OTP, documentation"
  },
  {
    technician_id: "tech-002",
    day_completed: 10,
    trainer_id: "trainer-02",
    module_status: "IN_PROGRESS",
    module_name: "Doctor-attestation context and compliant claims language"
  }
];

export const sampleFieldAudits: FieldAuditChecklist[] = [
  {
    order_id: "AEG-0001",
    audit_score: 17,
    critical_failures: [],
    corrective_action_due_date: "2026-03-10",
    auditor_id: "qa-01"
  },
  {
    order_id: "AEG-0002",
    audit_score: 12,
    critical_failures: ["OTP misuse"],
    corrective_action_due_date: "2026-03-05",
    auditor_id: "qa-02"
  }
];

export const sampleCertificationStatuses: CertificationStatus[] = [
  {
    technician_id: "tech-001",
    tier: "L1",
    status: "CERTIFIED",
    certified_on: "2026-03-01",
    next_review_due: "2026-09-01"
  },
  {
    technician_id: "tech-002",
    tier: "L1",
    status: "RECERT_REQUIRED",
    certified_on: "2026-02-15",
    next_review_due: "2026-03-15"
  }
];
