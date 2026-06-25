import Link from "next/link";
import {
  technicianReadinessLibrary,
  validateTechnicianReadinessProgram
} from "../../../../content/operations/technician-readiness";

export default function TechnicianReadinessPage() {
  const { startupSop, program, samples } = technicianReadinessLibrary;
  const validation = validateTechnicianReadinessProgram();

  return (
    <main className="page themeWarm">
      <section className="sectionBlock opsHero">
        <p className="eyebrow">Aegis Operations</p>
        <h1>Startup Field SOP with detailed technician readiness in reserve</h1>
        <p className="opsSubcopy">
          This page now starts with the short, must-follow SOP for live jobs. The full hiring, training, and QA
          readiness program remains below as the scale-up layer for later.
        </p>

        <div className="ctaRow">
          <Link href="/" className="commsBackLink">
            Back to Homepage
          </Link>
          <Link href="/communications" className="secondaryCta commsAnchorButton">
            Open Communications Pack
          </Link>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>{startupSop.title}</h2>
          <p>{startupSop.summary}</p>
        </div>

        <div className="opsCardGrid">
          {startupSop.steps.map((step, index) => (
            <article key={step.id} className="commsCard">
              <p className="opsDayChip">Step {index + 1}</p>
              <h3>{step.title}</h3>
              <ul className="commsList">
                {step.mustDo.map((item) => (
                  <li key={`${step.id}-${item}`}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="opsCardGrid">
          <article className="commsCard">
            <h3>Stop and escalate if any of these happen</h3>
            <ul className="commsList">
              {startupSop.escalationTriggers.map((trigger) => (
                <li key={trigger}>{trigger}</li>
              ))}
            </ul>
          </article>

          <article className="commsCard">
            <h3>Operating defaults</h3>
            <ul className="commsList">
              {startupSop.defaults.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="sectionBlock sectionOutline">
        <div className="sectionHeader">
          <h2>Program Validation Snapshot</h2>
          <p>Reference checks for the longer readiness program kept below for future scale-up.</p>
        </div>

        <div className="opsStatGrid">
          <article className="commsStatCard">
            <p className="commsStatValue">{validation.scorecardWeightTotal}</p>
            <p className="commsStatLabel">Scorecard Weight Total</p>
          </article>
          <article className="commsStatCard">
            <p className="commsStatValue">{validation.trainingDayCount}</p>
            <p className="commsStatLabel">Training Days</p>
          </article>
          <article className="commsStatCard">
            <p className="commsStatValue">{validation.fieldQaItemCount}</p>
            <p className="commsStatLabel">Field QA Checklist Items</p>
          </article>
          <article className="commsStatCard">
            <p className="commsStatValue">{validation.fieldQaMaxScore}</p>
            <p className="commsStatLabel">Field QA Max Score</p>
          </article>
        </div>

        <p className={validation.hasCorrectWeightTotal ? "commsOkText" : "commsWarnText"}>
          {validation.hasCorrectWeightTotal
            ? "Scorecard weight validation passed (100/100)."
            : "Scorecard weight validation failed."}
        </p>
        <p className={validation.hasFourteenDays ? "commsOkText" : "commsWarnText"}>
          {validation.hasFourteenDays
            ? "Training day validation passed (14-day curriculum)."
            : "Training day validation failed."}
        </p>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>Detailed readiness program: hiring scorecard (100 points)</h2>
          <p>Scale-up reference with weighted domains and minimum gate of 3/5 in every domain.</p>
        </div>

        <div className="compareWrap">
          <table className="compareTable opsTable">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Weight</th>
                <th>Test Method</th>
                <th>Minimum Gate</th>
              </tr>
            </thead>
            <tbody>
              {program.scorecardDomains.map((domain) => (
                <tr key={domain.id}>
                  <td>{domain.domain}</td>
                  <td>{domain.weight}</td>
                  <td>{domain.testMethod}</td>
                  <td>{domain.minimumGate}/5</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <article className="commsCard">
          <h3>Pass Rules</h3>
          <ul className="commsList">
            {program.passRules.map((rule) => (
              <li key={rule.id}>{rule.rule}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="sectionBlock sectionMuted">
        <div className="sectionHeader">
          <h2>Practical Hiring Tests</h2>
          <p>Longer-form admission checks retained for future technician scaling.</p>
        </div>

        <div className="opsCardGrid">
          {program.practicalHiringTests.map((test) => (
            <article key={test.id} className="commsCard">
              <h3>{test.name}</h3>
              <p className="commsNote">Duration: {test.durationMinutes} minutes</p>
              <p className="commsObjective">{test.objective}</p>
              <ul className="commsList">
                {test.successCriteria.map((criterion) => (
                  <li key={`${test.id}-${criterion}`}>{criterion}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>14-Day Training Curriculum</h2>
          <p>Detailed pre-deployment curriculum kept as a secondary readiness reference.</p>
        </div>

        <div className="opsTimeline">
          {program.trainingCurriculum.map((dayModule) => (
            <article key={dayModule.day} className="opsTimelineItem">
              <p className="opsDayChip">Day {dayModule.day}</p>
              <h3>{dayModule.topic}</h3>
              <p>{dayModule.outcome}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock sectionOutline">
        <div className="sectionHeader">
          <h2>Field QA Checklist (First 30 Jobs)</h2>
          <p>Scale-up QA model with scoring, critical-failure triggers, and retraining logic.</p>
        </div>

        <div className="opsCardGrid">
          {program.fieldQaChecklist.map((item) => (
            <article key={item.id} className="commsCard">
              <h3>{item.title}</h3>
              <p>{item.verification}</p>
            </article>
          ))}
        </div>

        <article className="commsCard">
          <h3>Scoring Rules</h3>
          <ul className="commsList">
            {program.fieldQaScoringRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </article>

        <article className="commsCard">
          <h3>Critical Failure Triggers</h3>
          <ul className="commsList">
            {program.criticalFailureTriggers.map((trigger) => (
              <li key={trigger}>{trigger}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="sectionBlock sectionMuted">
        <div className="sectionHeader">
          <h2>Pilot Rollout and Test Scenarios</h2>
          <p>Soft launch cadence and non-negotiable response playbooks.</p>
        </div>

        <article className="commsCard">
          <h3>Pilot Rollout (Weeks 1-4)</h3>
          <div className="compareWrap">
            <table className="compareTable opsTable">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Milestone</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {program.pilotRollout.map((milestone) => (
                  <tr key={`week-${milestone.week}-${milestone.milestone}`}>
                    <td>Week {milestone.week}</td>
                    <td>{milestone.milestone}</td>
                    <td>{milestone.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="commsCard">
          <h3>Test Scenarios</h3>
          <ul className="commsList">
            {program.testScenarios.map((scenario) => (
              <li key={scenario.id}>
                <strong>{scenario.scenario}</strong> {scenario.action}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>Acceptance Criteria and Assumptions</h2>
          <p>Operational finish line for deployment readiness.</p>
        </div>

        <article className="commsCard">
          <h3>Acceptance Criteria</h3>
          <ul className="commsList">
            {program.acceptanceCriteria.map((criterion) => (
              <li key={criterion}>{criterion}</li>
            ))}
          </ul>
        </article>

        <article className="commsCard">
          <h3>Assumptions and Defaults</h3>
          <ul className="commsList">
            {program.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="sectionBlock sectionOutline">
        <div className="sectionHeader">
          <h2>Sample Data Objects for CRM Integration</h2>
          <p>Examples for internal object shape and downstream integration tests.</p>
        </div>

        <div className="opsCardGrid">
          <article className="commsCard">
            <h3>TechnicianCandidateProfile</h3>
            <pre className="opsPre">{JSON.stringify(samples.candidateProfiles[0], null, 2)}</pre>
          </article>
          <article className="commsCard">
            <h3>HiringAssessmentScore</h3>
            <pre className="opsPre">{JSON.stringify(samples.hiringScores[0], null, 2)}</pre>
          </article>
          <article className="commsCard">
            <h3>TrainingProgressRecord</h3>
            <pre className="opsPre">{JSON.stringify(samples.trainingRecords[0], null, 2)}</pre>
          </article>
          <article className="commsCard">
            <h3>FieldAuditChecklist</h3>
            <pre className="opsPre">{JSON.stringify(samples.fieldAudits[0], null, 2)}</pre>
          </article>
          <article className="commsCard">
            <h3>CertificationStatus</h3>
            <pre className="opsPre">{JSON.stringify(samples.certificationStatuses[0], null, 2)}</pre>
          </article>
        </div>
      </section>
    </main>
  );
}
