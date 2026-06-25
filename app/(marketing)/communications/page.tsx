import Link from "next/link";
import { communicationsLibrary, validateCommunicationsLibrary } from "../../../content/communications";

function joinVariables(variables: string[]): string {
  if (variables.length === 0) {
    return "No dynamic variables";
  }
  return variables.map((item) => `{{${item}}}`).join(", ");
}

function renderList(title: string, lines?: string[]) {
  if (!lines || lines.length === 0) {
    return null;
  }

  return (
    <div className="commsListBlock">
      <p className="commsListTitle">{title}</p>
      <ul className="commsList">
        {lines.map((line) => (
          <li key={`${title}-${line}`}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default function CommunicationsPreviewPage() {
  const validation = validateCommunicationsLibrary();
  const transactionalTemplates = [
    ...communicationsLibrary.transactional.whatsapp,
    ...communicationsLibrary.transactional.sms
  ];

  return (
    <main className="page themeWarm">
      <section className="sectionBlock commsHero">
        <p className="eyebrow">Aegis Communications Preview</p>
        <h1>Website, transactional, campaign, and script communication pack</h1>
        <p className="commsSubcopy">
          This page visualizes the full English communication system currently stored in
          `apps/web/content/communications`.
        </p>
        <div className="ctaRow">
          <Link href="/" className="commsBackLink">
            Back to Homepage
          </Link>
          <a href="/compare-packages#packages" className="secondaryCta commsAnchorButton">
            Jump to Package Section
          </a>
          <Link href="/operations/technician-readiness" className="secondaryCta commsAnchorButton">
            Open Technician Readiness
          </Link>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>Validation Snapshot</h2>
          <p>Quick checks for lifecycle coverage and token contract integrity.</p>
        </div>

        <div className="commsStatGrid">
          <article className="commsStatCard">
            <p className="commsStatValue">{transactionalTemplates.length}</p>
            <p className="commsStatLabel">Transactional Templates</p>
          </article>
          <article className="commsStatCard">
            <p className="commsStatValue">{validation.missingLifecycleEvents.length}</p>
            <p className="commsStatLabel">Missing Lifecycle Events</p>
          </article>
          <article className="commsStatCard">
            <p className="commsStatValue">{validation.undefinedTemplateVariables.length}</p>
            <p className="commsStatLabel">Undefined Tokens</p>
          </article>
          <article className="commsStatCard">
            <p className="commsStatValue">{communicationsLibrary.templateVariableList.length}</p>
            <p className="commsStatLabel">Registered Dynamic Tokens</p>
          </article>
        </div>

        {validation.missingLifecycleEvents.length > 0 ? (
          <p className="commsWarnText">Missing events: {validation.missingLifecycleEvents.join(", ")}</p>
        ) : (
          <p className="commsOkText">All required lifecycle events are covered.</p>
        )}

        {validation.undefinedTemplateVariables.length > 0 ? (
          <p className="commsWarnText">Undefined tokens: {validation.undefinedTemplateVariables.join(", ")}</p>
        ) : (
          <p className="commsOkText">All template variables are registered.</p>
        )}
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>Website Communication Pack</h2>
          <p>Primary website copy and CTA bank.</p>
        </div>

        <article className="commsCard">
          <h3>Hero</h3>
          <p className="commsHeadline">{communicationsLibrary.website.hero.headline}</p>
          <p>{communicationsLibrary.website.hero.subcopy}</p>
          {renderList("Trust Badges", communicationsLibrary.website.hero.trustBadges)}
          {renderList("Primary CTAs", communicationsLibrary.website.hero.primaryCtas)}
          {renderList("Secondary CTAs", communicationsLibrary.website.hero.secondaryCtas)}
        </article>

        <article className="commsCard">
          <h3>Process Module</h3>
          <p>{communicationsLibrary.website.process.intro}</p>
          {renderList("Step Microcopy", communicationsLibrary.website.process.stepMicrocopy)}
        </article>

        <article className="commsCard">
          <h3>Packages + Payment Framing</h3>
          <p>{communicationsLibrary.website.packages.sectionSubcopy}</p>
          {renderList("Value Framing", communicationsLibrary.website.packages.valueFramingBullets)}
          <p className="commsNote">{communicationsLibrary.website.packages.paymentNote}</p>
        </article>

        <article className="commsCard">
          <h3>FAQ ({communicationsLibrary.website.faq.length})</h3>
          <div className="commsFaqGrid">
            {communicationsLibrary.website.faq.map((item) => (
              <details key={item.question} className="commsFaqItem">
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </article>
      </section>

      <section className="sectionBlock sectionMuted">
        <div className="sectionHeader">
          <h2>Transactional Templates</h2>
          <p>WhatsApp primary + SMS fallback across booking, service, payment, and support lifecycle.</p>
        </div>

        <div className="commsTemplateGrid">
          {transactionalTemplates.map((template) => (
            <article key={template.id} className="commsTemplateCard">
              <div className="commsTemplateTop">
                <span className="commsChannelChip">{template.channel}</span>
                <span className="commsEventChip">{template.lifecycleEvent}</span>
              </div>
              <h3>{template.name}</h3>
              <p className="commsObjective">{template.objective}</p>
              <p className="commsTemplateBody">{template.body}</p>
              <p className="commsVariables">Variables: {joinVariables(template.variables)}</p>
              {template.ctaLabel ? (
                <p className="commsCtaLine">
                  CTA: {template.ctaLabel}
                  {template.ctaUrl ? ` -> ${template.ctaUrl}` : ""}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionHeader">
          <h2>Campaign Assets</h2>
          <p>Meta, Google, WhatsApp campaigns and lifecycle email copy.</p>
        </div>

        {[
          communicationsLibrary.campaigns.meta,
          communicationsLibrary.campaigns.google,
          communicationsLibrary.campaigns.whatsapp,
          communicationsLibrary.campaigns.email
        ].map((campaignSet) => (
          <article key={campaignSet.channel} className="commsCard">
            <h3>
              {campaignSet.channel} ({campaignSet.assets.length} themes)
            </h3>
            <p className="commsObjective">{campaignSet.objective}</p>
            <p className="commsNote">Default destination: {campaignSet.destination}</p>

            <div className="commsCampaignGrid">
              {campaignSet.assets.map((asset) => (
                <article key={`${campaignSet.channel}-${asset.theme}`} className="commsCampaignCard">
                  <p className="commsCampaignTheme">{asset.theme}</p>
                  <p className="commsCampaignMeta">
                    Audience: {asset.audience}
                    {asset.cityVariant ? ` | City: ${asset.cityVariant}` : ""}
                  </p>

                  {renderList("Primary Texts", asset.primaryTexts)}
                  {renderList("Headlines", asset.headlines)}
                  {renderList("Descriptions", asset.descriptions)}
                  {renderList("WhatsApp Messages", asset.messages)}
                  {renderList("Email Subjects", asset.subjectLines)}
                  {renderList("Email Body", asset.bodyLines)}

                  <p className="commsNote">
                    CTA: {asset.cta} -&gt; {asset.destination}
                  </p>
                </article>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="sectionBlock sectionOutline">
        <div className="sectionHeader">
          <h2>Internal Scripts</h2>
          <p>Callback, onsite, and grievance scripts for operations and technicians.</p>
        </div>

        <div className="commsScriptGrid">
          {communicationsLibrary.scripts.map((script) => (
            <article key={script.id} className="commsScriptCard">
              <h3>{script.name}</h3>
              <p className="commsObjective">{script.objective}</p>
              <p className="commsNote">
                Channel: {script.channel} | Audience: {script.audience}
              </p>
              <ol className="commsScriptSteps">
                {script.steps.map((step, index) => (
                  <li key={`${script.id}-${index}`}>
                    <strong>{step.speaker}:</strong> {step.line}
                  </li>
                ))}
              </ol>
              <p className="commsEscalation">Escalation: {script.escalationRule}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sectionBlock sectionMuted">
        <div className="sectionHeader">
          <h2>Compliance + Guardrails</h2>
          <p>Mandatory policy blocks used across all communication assets.</p>
        </div>

        <article className="commsCard">
          <h3>Voice Summary</h3>
          <p>{communicationsLibrary.guardrails.voiceSummary}</p>
          {renderList("Allowed Patterns", communicationsLibrary.guardrails.allowedPatterns)}
          {renderList("Banned Patterns", communicationsLibrary.guardrails.bannedPatterns)}
          {renderList("Proof Policy", communicationsLibrary.guardrails.proofPolicy)}
        </article>
      </section>
    </main>
  );
}
