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

  const existing = window.sessionStorage.getItem(sessionStorageKey);
  if (existing) {
    return existing;
  }

  const sessionId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem(sessionStorageKey, sessionId);
  return sessionId;
}

export function storeLeadCtaContext(context: Partial<AttributionContext>) {
  if (!canUseBrowserApis()) {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);

  writeJsonToSessionStorage(ctaStorageKey, {
    sessionId: getLeadCaptureSessionId(),
    pagePath: window.location.pathname,
    referrer: document.referrer || undefined,
    pageSection: context.pageSection,
    entryPoint: context.entryPoint,
    ctaId: context.ctaId,
    packageCode: context.packageCode,
    packageName: context.packageName,
    utmSource: getUrlParam(searchParams, "utm_source"),
    utmMedium: getUrlParam(searchParams, "utm_medium"),
    utmCampaign: getUrlParam(searchParams, "utm_campaign"),
    utmTerm: getUrlParam(searchParams, "utm_term"),
    utmContent: getUrlParam(searchParams, "utm_content"),
    gclid: getUrlParam(searchParams, "gclid"),
    fbclid: getUrlParam(searchParams, "fbclid")
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

  window.sessionStorage.removeItem(quizStorageKey);
}

export function getQuizContext() {
  return readJsonFromSessionStorage<QuizContext>(quizStorageKey);
}
