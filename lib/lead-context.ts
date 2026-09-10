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
  fbclid?: string;
};

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

function getUrlParam(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  return value || undefined;
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

  const searchParams = new URLSearchParams(window.location.search);
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
    utmSource: getUrlParam(searchParams, "utm_source") || previous?.utmSource,
    utmMedium: getUrlParam(searchParams, "utm_medium") || previous?.utmMedium,
    utmCampaign: getUrlParam(searchParams, "utm_campaign") || previous?.utmCampaign,
    utmTerm: getUrlParam(searchParams, "utm_term") || previous?.utmTerm,
    utmContent: getUrlParam(searchParams, "utm_content") || previous?.utmContent,
    gclid: getUrlParam(searchParams, "gclid") || previous?.gclid,
    fbclid: getUrlParam(searchParams, "fbclid") || previous?.fbclid
  } satisfies AttributionContext);
}

export function getLeadAttributionContext(overrides: Partial<AttributionContext> = {}) {
  if (!canUseBrowserApis()) {
    return null;
  }

  const storedCtaContext = readJsonFromSessionStorage<AttributionContext>(ctaStorageKey);
  const searchParams = new URLSearchParams(window.location.search);

  return {
    sessionId: getLeadCaptureSessionId(),
    pagePath: overrides.pagePath || window.location.pathname,
    referrer: document.referrer || storedCtaContext?.referrer || undefined,
    pageSection: overrides.pageSection || storedCtaContext?.pageSection,
    entryPoint: overrides.entryPoint || storedCtaContext?.entryPoint,
    ctaId: overrides.ctaId || storedCtaContext?.ctaId,
    packageCode: overrides.packageCode || storedCtaContext?.packageCode,
    packageName: overrides.packageName || storedCtaContext?.packageName,
    utmSource: getUrlParam(searchParams, "utm_source") || storedCtaContext?.utmSource,
    utmMedium: getUrlParam(searchParams, "utm_medium") || storedCtaContext?.utmMedium,
    utmCampaign: getUrlParam(searchParams, "utm_campaign") || storedCtaContext?.utmCampaign,
    utmTerm: getUrlParam(searchParams, "utm_term") || storedCtaContext?.utmTerm,
    utmContent: getUrlParam(searchParams, "utm_content") || storedCtaContext?.utmContent,
    gclid: getUrlParam(searchParams, "gclid") || storedCtaContext?.gclid,
    fbclid: getUrlParam(searchParams, "fbclid") || storedCtaContext?.fbclid
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
