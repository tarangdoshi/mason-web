# Technician Readiness Library

Structured operations content for Mason Company technician hiring, training, certification, and field QA.

The library now also includes a short `Startup Field SOP` that serves as the live-job default for an early-stage team.
The longer readiness content remains in place as the scale-up layer for later hiring and training maturity.

## Files

- `types.ts`
  - Internal objects for future CRM/ops integration:
    - `TechnicianCandidateProfile`
    - `HiringAssessmentScore`
    - `TrainingProgressRecord`
    - `FieldAuditChecklist`
    - `CertificationStatus`
- `data.ts`
  - Startup operations content:
    - Short field SOP with must-follow steps, escalation triggers, and defaults
  - Full readiness program content:
    - Weighted hiring scorecard and pass rules
    - Practical hiring tests
    - 14-day training curriculum
    - Field QA checklist and scoring rules
    - Pilot rollout, failure scenarios, acceptance criteria
  - Sample records for candidate, assessment, training, QA, certification.
- `index.ts`
  - Export barrel and validation helper (`validateTechnicianReadinessProgram`).

## Validation expectations

- Scorecard weight total: `100`
- Training day count: `14`
- Field QA max score: `18` (9 checklist items x 2)
