import { getPackageCodeFromName, quizVersion } from "./crm-contract";

const quizStorageKey = "mason-crm-quiz-context";
const ctaStorageKey = "mason-crm-cta-context";
const sessionStorageKey = "mason-crm-session-id";

type AttributionContext = {
  sessionId: string;
  pagePath: string;
  referrer?: string;
  pageSection?: string;
  entryPoint?: string;
  ctaId?: string;
  packageCode?: string;
  packageName?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
};

/** Landing-URL parameter → stored attribution key. */
const CAMPAIGN_PARAMS = {
  utm_source: "utmSource",
  utm_medium: "utmMedium",
  utm_campaign: "utmCampaign",
  utm_term: "utmTerm",
  utm_content: "utmContent",
  gclid: "gclid",
  gbraid: "gbraid",
  wbraid: "wbraid",
  fbclid: "fbclid"
} as const;

export type CampaignAttribution = Partial<Record<(typeof CAMPAIGN_PARAMS)[keyof typeof CAMPAIGN_PARAMS], string>>;

// Campaign URLs are outside Mason's control, so values are bounded here as
// well as by the API before they reach Zoho.
const MAX_CAMPAIGN_VALUE_LENGTH = 255;

type QuizContext = {
  quizVersion: string;
  quizScore: number;
  quizBandId: string;
  quizBandLabel: string;
  recommendedPackageCode: string | null;
  recommendedPackageName: string;
  quizAnswers: Record<string, string>;
};

function canUseBrowserApis() {
  return typeof window !== "undefined";
}

function readJsonFromSessionStorage<T>(key: string): T | null {
  if (!canUseBrowserApis()) {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as T;
  } catch {
    return null;
  }
}

function writeJsonToSessionStorage(key: string, value: unknown) {
  if (!canUseBrowserApis()) {
    return;
  }

  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors so lead capture keeps working.
  }
}

function cleanCampaignValue(value: string | null | undefined) {
  const cleaned = value?.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return cleaned ? cleaned.slice(0, MAX_CAMPAIGN_VALUE_LENGTH) : undefined;
}

/** Campaign parameters on a landing URL, or null when it carries none. */
export function readCampaignFromSearch(search: string): CampaignAttribution | null {
  let searchParams: URLSearchParams;
  try {
    searchParams = new URLSearchParams(search);
  } catch {
    return null;
  }

  const campaign: CampaignAttribution = {};
  for (const [param, key] of Object.entries(CAMPAIGN_PARAMS)) {
    const value = cleanCampaignValue(searchParams.get(param));
    if (value) {
      campaign[key] = value;
    }
  }
  return Object.keys(campaign).length > 0 ? campaign : null;
}

/** The campaign fields already held in a stored context, or null. */
function storedCampaign(context: Partial<AttributionContext> | null): CampaignAttribution | null {
  if (!context) {
    return null;
  }

  const campaign: CampaignAttribution = {};
  for (const key of Object.values(CAMPAIGN_PARAMS)) {
    const value = cleanCampaignValue(typeof context[key] === "string" ? context[key] : undefined);
    if (value) {
      campaign[key] = value;
    }
  }
  return Object.keys(campaign).length > 0 ? campaign : null;
}

/**
 * The original campaign for this browser session. The first campaign landing
 * is kept as one set: a later URL never mixes its parameters into it, so the
 * source, medium, campaign and click ids always describe the same visit.
 */
function resolveCampaign(previous: Partial<AttributionContext> | null): CampaignAttribution {
  return storedCampaign(previous) ?? readCampaignFromSearch(window.location.search) ?? {};
}

export function getLeadCaptureSessionId() {
  if (!canUseBrowserApis()) {
    return "server-render";
  }

  let existing: string | null = null;
  try { existing = window.sessionStorage.getItem(sessionStorageKey); } catch { /* Storage must not block leads. */ }
  if (existing) {
    return existing;
  }

  const sessionId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try { window.sessionStorage.setItem(sessionStorageKey, sessionId); } catch { /* Storage must not block leads. */ }
  return sessionId;
}

export function storeLeadCtaContext(context: Partial<AttributionContext>) {
  if (!canUseBrowserApis()) {
    return;
  }

  const previous = readJsonFromSessionStorage<AttributionContext>(ctaStorageKey);

  writeJsonToSessionStorage(ctaStorageKey, {
    sessionId: getLeadCaptureSessionId(),
    pagePath: window.location.pathname,
    referrer: document.referrer || undefined,
    pageSection: context.pageSection || previous?.pageSection,
    entryPoint: context.entryPoint || previous?.entryPoint,
    ctaId: context.ctaId || previous?.ctaId,
    packageCode: context.packageCode || previous?.packageCode,
    packageName: context.packageName || previous?.packageName,
    ...resolveCampaign(previous)
  } satisfies AttributionContext);
}

export function getLeadAttributionContext(overrides: Partial<AttributionContext> = {}) {
  if (!canUseBrowserApis()) {
    return null;
  }

  const storedCtaContext = readJsonFromSessionStorage<AttributionContext>(ctaStorageKey);

  return {
    sessionId: getLeadCaptureSessionId(),
    pagePath: overrides.pagePath || window.location.pathname,
    referrer: document.referrer || storedCtaContext?.referrer || undefined,
    pageSection: overrides.pageSection || storedCtaContext?.pageSection,
    entryPoint: overrides.entryPoint || storedCtaContext?.entryPoint,
    ctaId: overrides.ctaId || storedCtaContext?.ctaId,
    packageCode: overrides.packageCode || storedCtaContext?.packageCode,
    packageName: overrides.packageName || storedCtaContext?.packageName,
    ...resolveCampaign(storedCtaContext)
  };
}

export function storeQuizContext(payload: Omit<QuizContext, "quizVersion" | "recommendedPackageCode"> & { recommendedPackageCode?: string | null }) {
  writeJsonToSessionStorage(quizStorageKey, {
    quizVersion,
    quizScore: payload.quizScore,
    quizBandId: payload.quizBandId,
    quizBandLabel: payload.quizBandLabel,
    recommendedPackageCode: payload.recommendedPackageCode ?? getPackageCodeFromName(payload.recommendedPackageName),
    recommendedPackageName: payload.recommendedPackageName,
    quizAnswers: payload.quizAnswers
  } satisfies QuizContext);
}

export function clearQuizContext() {
  if (!canUseBrowserApis()) {
    return;
  }

  try { window.sessionStorage.removeItem(quizStorageKey); } catch { /* Storage is optional. */ }
}

export function getQuizContext() {
  return readJsonFromSessionStorage<QuizContext>(quizStorageKey);
}
