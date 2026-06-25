export type LaunchCity = "Mumbai" | "Goa";

export type AssessmentStatus = "PASS" | "FAIL" | "RESTRICTED" | "PENDING";

export type CertificationTier = "L1" | "L2";

export type CertificationState = "CERTIFIED" | "RESTRICTED" | "SUSPENDED" | "RECERT_REQUIRED";

export type ModuleStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface TechnicianCandidateProfile {
  name: string;
  city: LaunchCity;
  languages: string[];
  experience_years: number;
  background_verified: boolean;
}

export interface HiringAssessmentScore {
  candidate_id: string;
  technical_score: number;
  safety_score: number;
  communication_score: number;
  sop_score: number;
  digital_score: number;
  total_weighted_score: number;
  status: AssessmentStatus;
}

export interface TrainingProgressRecord {
  technician_id: string;
  day_completed: number;
  trainer_id: string;
  module_status: ModuleStatus;
  module_name: string;
}

export interface FieldAuditChecklist {
  order_id: string;
  audit_score: number;
  critical_failures: string[];
  corrective_action_due_date: string;
  auditor_id: string;
}

export interface CertificationStatus {
  technician_id: string;
  tier: CertificationTier;
  status: CertificationState;
  certified_on: string;
  next_review_due: string;
}

export interface ScorecardDomain {
  id: string;
  domain: string;
  weight: number;
  testMethod: string;
  minimumGate: number;
}

export interface PassRule {
  id: string;
  rule: string;
}

export interface PracticalHiringTest {
  id: string;
  name: string;
  durationMinutes: number;
  objective: string;
  successCriteria: string[];
}

export interface TrainingDayModule {
  day: number;
  topic: string;
  outcome: string;
}

export interface FieldQaChecklistItem {
  id: string;
  title: string;
  verification: string;
}

export interface PilotRolloutMilestone {
  week: number;
  milestone: string;
  target: string;
}

export interface RiskScenario {
  id: string;
  scenario: string;
  action: string;
}

export interface StartupFieldSopStep {
  id: string;
  title: string;
  mustDo: string[];
}

export interface StartupFieldSop {
  title: string;
  summary: string;
  steps: StartupFieldSopStep[];
  escalationTriggers: string[];
  defaults: string[];
}

export interface TechnicianReadinessProgram {
  title: string;
  markets: LaunchCity[];
  operatingLanguageBaseline: string[];
  optionalLanguagePreference: string[];
  scorecardDomains: ScorecardDomain[];
  passRules: PassRule[];
  practicalHiringTests: PracticalHiringTest[];
  trainingCurriculum: TrainingDayModule[];
  fieldQaChecklist: FieldQaChecklistItem[];
  fieldQaScoringRules: string[];
  criticalFailureTriggers: string[];
  pilotRollout: PilotRolloutMilestone[];
  testScenarios: RiskScenario[];
  acceptanceCriteria: string[];
  assumptions: string[];
}
