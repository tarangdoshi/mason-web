export type CityCode = "Mumbai" | "Goa";

export type TemplateChannel = "WHATSAPP" | "SMS" | "EMAIL" | "WEB" | "SCRIPT";

export type AudienceType = "BUYER_CHILD" | "ELDER_END_USER" | "FAMILY_DECISION_UNIT";

export type LifecycleEventKey =
  | "ORDER_PLACED"
  | "ORDER_CONFIRMED"
  | "TECH_ASSIGNED"
  | "TECH_EN_ROUTE"
  | "VISIT_IN_PROGRESS"
  | "WORK_COMPLETED"
  | "PAYMENT_COLLECTION_REQUEST"
  | "PAYMENT_RECEIVED"
  | "ONLINE_PAYMENT_SUCCESS"
  | "ONLINE_PAYMENT_FAILED"
  | "ORDER_CANCELLED"
  | "PARTIAL_REFUND_INITIATED"
  | "FULL_REFUND_INITIATED"
  | "SIX_MONTH_CHECKIN_INVITE"
  | "GRIEVANCE_ACKNOWLEDGED"
  | "GRIEVANCE_RESOLVED"
  | "TESTIMONIAL_REQUEST";

export type TemplateVariableKey =
  | "customer_name"
  | "city"
  | "order_number"
  | "package_name"
  | "package_price"
  | "visit_date"
  | "visit_time_slot"
  | "technician_name"
  | "otp_code"
  | "payment_mode"
  | "collection_method"
  | "amount_paid"
  | "refund_amount"
  | "refund_eta"
  | "support_phone"
  | "support_whatsapp"
  | "grievance_ticket_id";

export interface TemplateVariableDefinition {
  key: TemplateVariableKey;
  token: `{{${TemplateVariableKey}}}`;
  label: string;
  description: string;
  example: string;
  requiredIn: TemplateChannel[];
}

export interface CommunicationTemplate {
  id: string;
  name: string;
  channel: TemplateChannel;
  audience: AudienceType;
  objective: string;
  lifecycleEvent?: LifecycleEventKey;
  cityVariant?: CityCode;
  packageVariant?: string;
  subject?: string;
  previewText?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  variables: TemplateVariableKey[];
  complianceNotes?: string[];
}

export interface WebsiteFaqItem {
  question: string;
  answer: string;
}

export interface WebsiteCommunicationPack {
  hero: {
    headline: string;
    subcopy: string;
    trustBadges: string[];
    primaryCtas: string[];
    secondaryCtas: string[];
  };
  process: {
    title: string;
    intro: string;
    stepMicrocopy: string[];
  };
  packages: {
    sectionTitle: string;
    sectionSubcopy: string;
    valueFramingBullets: string[];
    paymentNote: string;
  };
  whyAegis: {
    title: string;
    points: { title: string; description: string }[];
  };
  testimonials: {
    title: string;
    framingCopy: string;
    legalNote: string;
  };
  doctorAttestation: {
    title: string;
    framingCopy: string;
    disclaimer: string;
  };
  otpTrust: {
    title: string;
    lines: string[];
  };
  support: {
    title: string;
    lines: string[];
  };
  ctaBank: {
    sticky: string[];
    card: string[];
    nav: string[];
  };
  faq: WebsiteFaqItem[];
}

export interface InternalScriptStep {
  speaker: "AGENT" | "CUSTOMER" | "TECHNICIAN";
  line: string;
}

export interface InternalScript {
  id: string;
  name: string;
  objective: string;
  channel: "CALL" | "WHATSAPP" | "ONSITE";
  audience: AudienceType;
  steps: InternalScriptStep[];
  escalationRule: string;
}

export type CampaignChannel = "META" | "GOOGLE" | "WHATSAPP" | "EMAIL";

export interface CampaignThemeAsset {
  theme: string;
  audience: AudienceType;
  primaryTexts?: string[];
  headlines?: string[];
  descriptions?: string[];
  messages?: string[];
  subjectLines?: string[];
  bodyLines?: string[];
  cta: string;
  destination: string;
  cityVariant?: CityCode;
}

export interface CampaignAssetSet {
  channel: CampaignChannel;
  objective: string;
  destination: string;
  assets: CampaignThemeAsset[];
}

export interface MessagingGuardrails {
  voiceSummary: string;
  allowedPatterns: string[];
  bannedPatterns: string[];
  proofPolicy: string[];
}
