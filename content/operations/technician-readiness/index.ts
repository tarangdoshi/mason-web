import {
  sampleCandidateProfiles,
  sampleCertificationStatuses,
  sampleFieldAudits,
  sampleHiringScores,
  startupFieldSop,
  sampleTrainingRecords,
  technicianReadinessProgram
} from "./data";

export * from "./types";
export * from "./data";

export const technicianReadinessLibrary = {
  startupSop: startupFieldSop,
  program: technicianReadinessProgram,
  samples: {
    candidateProfiles: sampleCandidateProfiles,
    hiringScores: sampleHiringScores,
    trainingRecords: sampleTrainingRecords,
    fieldAudits: sampleFieldAudits,
    certificationStatuses: sampleCertificationStatuses
  }
};

export function validateTechnicianReadinessProgram(): {
  scorecardWeightTotal: number;
  hasCorrectWeightTotal: boolean;
  trainingDayCount: number;
  hasFourteenDays: boolean;
  fieldQaItemCount: number;
  fieldQaMaxScore: number;
} {
  const scorecardWeightTotal = technicianReadinessProgram.scorecardDomains.reduce(
    (sum, domain) => sum + domain.weight,
    0
  );

  const trainingDayCount = technicianReadinessProgram.trainingCurriculum.length;
  const fieldQaItemCount = technicianReadinessProgram.fieldQaChecklist.length;

  return {
    scorecardWeightTotal,
    hasCorrectWeightTotal: scorecardWeightTotal === 100,
    trainingDayCount,
    hasFourteenDays: trainingDayCount === 14,
    fieldQaItemCount,
    fieldQaMaxScore: fieldQaItemCount * 2
  };
}
