import { brandVoiceGuardrails } from "./brand-voice";
import { metaCampaignAssets } from "./campaigns.meta";
import { googleCampaignAssets } from "./campaigns.google";
import { whatsappCampaignAssets } from "./campaigns.whatsapp";
import { emailCampaignAssets } from "./campaigns.email";
import { complianceLibrary, mandatoryComplianceNotes } from "./compliance";
import { internalScripts } from "./scripts";
import { transactionalSmsTemplates } from "./transactional.sms";
import { transactionalWhatsAppTemplates } from "./transactional.whatsapp";
import type { CommunicationTemplate, LifecycleEventKey, TemplateVariableKey } from "./types";
import { templateVariableList, templateVariables } from "./variables";
import { websiteCommunicationPack } from "./website";

export * from "./types";
export * from "./variables";
export * from "./brand-voice";
export * from "./website";
export * from "./transactional.whatsapp";
export * from "./transactional.sms";
export * from "./scripts";
export * from "./campaigns.meta";
export * from "./campaigns.google";
export * from "./campaigns.whatsapp";
export * from "./campaigns.email";
export * from "./compliance";

export const communicationsLibrary = {
  guardrails: brandVoiceGuardrails,
  complianceLibrary,
  mandatoryComplianceNotes,
  templateVariableList,
  website: websiteCommunicationPack,
  transactional: {
    whatsapp: transactionalWhatsAppTemplates,
    sms: transactionalSmsTemplates
  },
  campaigns: {
    meta: metaCampaignAssets,
    google: googleCampaignAssets,
    whatsapp: whatsappCampaignAssets,
    email: emailCampaignAssets
  },
  scripts: internalScripts
};

const requiredLifecycleEvents: LifecycleEventKey[] = [
  "ORDER_PLACED",
  "ORDER_CONFIRMED",
  "TECH_ASSIGNED",
  "TECH_EN_ROUTE",
  "VISIT_IN_PROGRESS",
  "WORK_COMPLETED",
  "PAYMENT_COLLECTION_REQUEST",
  "PAYMENT_RECEIVED",
  "ONLINE_PAYMENT_SUCCESS",
  "ONLINE_PAYMENT_FAILED",
  "ORDER_CANCELLED",
  "PARTIAL_REFUND_INITIATED",
  "FULL_REFUND_INITIATED",
  "SIX_MONTH_CHECKIN_INVITE",
  "GRIEVANCE_ACKNOWLEDGED",
  "GRIEVANCE_RESOLVED",
  "TESTIMONIAL_REQUEST"
];

function findUndefinedVariables(templates: CommunicationTemplate[]): string[] {
  return templates
    .flatMap((template) => template.variables.map((key) => `${template.id}:${key}`))
    .filter((entry) => {
      const key = entry.split(":")[1] as TemplateVariableKey;
      return !templateVariables[key];
    });
}

function findMissingLifecycleEvents(templates: CommunicationTemplate[]): LifecycleEventKey[] {
  const provided = new Set(
    templates
      .map((template) => template.lifecycleEvent)
      .filter((event): event is LifecycleEventKey => Boolean(event))
  );

  return requiredLifecycleEvents.filter((event) => !provided.has(event));
}

export function validateCommunicationsLibrary(): {
  missingLifecycleEvents: LifecycleEventKey[];
  undefinedTemplateVariables: string[];
  transactionalTemplateCount: number;
} {
  const combinedTransactionalTemplates = [...transactionalWhatsAppTemplates, ...transactionalSmsTemplates];

  return {
    missingLifecycleEvents: findMissingLifecycleEvents(combinedTransactionalTemplates),
    undefinedTemplateVariables: findUndefinedVariables(combinedTransactionalTemplates),
    transactionalTemplateCount: combinedTransactionalTemplates.length
  };
}
