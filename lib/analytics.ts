"use client";

/* Parameters shared by the marketing funnel events defined in Events
   Requirement.xlsx. `city` is the market the visitor's address resolved to
   (Goa / Bangalore / Other); it is omitted while unknown rather than guessed. */
type CityParam = { city?: string };
type PackageParams = CityParam & { package_name: string; package_price?: number };
type FormParams = CityParam & { form_name: string; package_name?: string };

export type AnalyticsEventMap = {
  page_view: CityParam & {
    page: string;
    page_location?: string;
    page_title?: string;
  };
  view_service: CityParam & { service_name: string };
  view_package: PackageParams;
  select_package: PackageParams;
  form_start: FormParams;
  form_submit: FormParams;
  generate_lead: FormParams & {
    lead_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
  };
  homepage_cta_click: {
    page?: string;
    cta_location: string;
    section: string;
  };
  package_cta_click: {
    page?: string;
    package: string;
    cta_location: string;
    section: string;
  };
  guidance_form_start: {
    page?: string;
    cta_location: string;
    section: string;
  };
  guidance_lead_submit_success: {
    page?: string;
    cta_location: string;
    section: string;
  };
  assessment_form_start: {
    page?: string;
    cta_location: string;
    section: string;
  };
  assessment_lead_submit_success: {
    page?: string;
    cta_location: string;
    section: string;
  };
  checkout_start: {
    page?: string;
    package: string;
    cta_location: string;
    section: string;
  };
  checkout_lead_submit_success: {
    page?: string;
    package: string;
    cta_location: string;
    section: string;
  };
  phone_click: {
    page?: string;
    cta_location: string;
    section: string;
  };
  whatsapp_click: {
    page?: string;
    cta_location: string;
    section: string;
  };
  location_picker_success: {
    market: "GOA" | "BANGALORE" | "OTHER" | "UNKNOWN";
    form_source: string;
  };
  location_picker_fallback: {
    market: "UNKNOWN";
    form_source: string;
  };
  lead_location_market: {
    market: "GOA" | "BANGALORE" | "OTHER" | "UNKNOWN";
    form_source: string;
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

type AnalyticsPayload = Partial<Record<string, string | number>>;

type FbqFunction = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    __masonGoogleTagConfigured?: boolean;
    __masonMetaPixelConfigured?: boolean;
  }
}

const allowedEventNames = new Set<AnalyticsEventName>([
  "page_view",
  "view_service",
  "view_package",
  "select_package",
  "form_start",
  "form_submit",
  "generate_lead",
  "homepage_cta_click",
  "package_cta_click",
  "guidance_form_start",
  "guidance_lead_submit_success",
  "assessment_form_start",
  "assessment_lead_submit_success",
  "checkout_start",
  "checkout_lead_submit_success",
  "phone_click",
  "whatsapp_click",
  "location_picker_success",
  "location_picker_fallback",
  "lead_location_market"
]);

const allowedTextKeys = [
  "page",
  "package",
  "cta_location",
  "section",
  "market",
  "form_source",
  "page_title",
  "city",
  "service_name",
  "package_name",
  "form_name",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content"
] as const;

const allowedNumberKeys = ["package_price"] as const;

/* Funnel events that carry the visitor's market when it is known. */
const cityEvents = new Set<AnalyticsEventName>([
  "page_view",
  "view_service",
  "view_package",
  "select_package",
  "form_start",
  "form_submit",
  "generate_lead"
]);

/* Landing-page parameters kept on page_location, because GA4 and Google Ads
   read campaign attribution from them. Every other query value is dropped. */
const campaignQueryParams = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid"
];
const analyticsCampaignTextKeys = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content"]);

/* Meta receives only the events the tracking spreadsheet assigns to it; the
   successful lead is sent as Meta's standard Lead event. */
const metaCustomEvents = new Set<AnalyticsEventName>(["view_package", "select_package", "form_start"]);

/* service_name values for view_service. Mason sells one service with two
   visible parts: the free safety visit and the installation that follows. */
export const SERVICE_NAMES = {
  safetyAssessment: "Safety Assessment",
  safetyInstallation: "Safety Installation"
} as const;

const analyticsCityStorageKey = "mason-analytics-city";
const MAX_TEXT_LENGTH = 120;

export function getAnalyticsMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
}

export function getGoogleAdsId() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "";
}

function getGoogleAdsLeadLabel() {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL?.trim() || "";
}

export function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";
}

/** The id gtag.js is loaded with: GA4 when configured, else Google Ads. */
export function getGoogleTagLoaderId() {
  return getAnalyticsMeasurementId() || getGoogleAdsId();
}

export function isAllowedAnalyticsEventName(value: string): value is AnalyticsEventName {
  return allowedEventNames.has(value as AnalyticsEventName);
}

function isBrowser() {
  return typeof window !== "undefined";
}

function sanitizeContextValue(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed);
    return parsed.pathname || "/";
  } catch {
    return trimmed.split("?")[0]?.split("#")[0]?.slice(0, MAX_TEXT_LENGTH);
  }
}

/* A last line of defence: analytics parameters describe pages, packages and
   campaigns, never people. A value that looks like an email address or a phone
   number is dropped rather than sent. */
function looksLikeContactDetail(value: string) {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // An invalid escape is still checked as written.
  }
  return decoded.includes("@") || /\d{10,}/.test(decoded.replace(/[\s()+._-]/g, ""));
}

/** Campaign values in analytics are identifiers, not arbitrary free text. */
function safeAnalyticsCampaignValue(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && /^[A-Za-z0-9._~:/=-]+$/.test(trimmed) && !looksLikeContactDetail(trimmed)
    ? trimmed.slice(0, 255)
    : undefined;
}

function safeAnalyticsPath(pathname: string) {
  return looksLikeContactDetail(pathname) || /%20|\s/i.test(pathname) ? "/" : pathname;
}

function sanitizePageLocation(raw: string) {
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return undefined;
    const kept = new URLSearchParams();
    for (const param of campaignQueryParams) {
      const value = safeAnalyticsCampaignValue(url.searchParams.get(param));
      if (value) kept.set(param, value);
    }
    const query = kept.toString();
    return `${url.origin}${safeAnalyticsPath(url.pathname)}${query ? `?${query}` : ""}`;
  } catch {
    return undefined;
  }
}

/* Lead ids are opaque record ids (for example a Zoho CRM record id), which are
   long digit strings — so they are validated by shape rather than by the
   contact-detail check above. */
function sanitizeLeadId(value: unknown) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(value) ? value : undefined;
}

export function getCurrentAnalyticsPage() {
  if (!isBrowser()) {
    return "/";
  }

  return safeAnalyticsPath(window.location.pathname);
}

/** The current URL with only campaign parameters kept on the query string. */
export function getAnalyticsPageLocation() {
  if (!isBrowser()) {
    return undefined;
  }

  return sanitizePageLocation(window.location.href);
}

const marketCityLabels: Record<string, string> = {
  GOA: "Goa",
  BANGALORE: "Bangalore",
  OTHER: "Other"
};

/** Market label for analytics, or undefined while the market is unknown. */
export function cityFromMarket(market: string | null | undefined) {
  return market ? marketCityLabels[market] : undefined;
}

/** Remembers the visitor's resolved market so later events can carry city. */
export function setAnalyticsMarket(market: string | null | undefined) {
  const city = cityFromMarket(market);
  if (!isBrowser() || !city) {
    return;
  }

  try {
    window.sessionStorage.setItem(analyticsCityStorageKey, city);
  } catch {
    // Storage is optional for analytics.
  }
}

export function getAnalyticsCity() {
  if (!isBrowser()) {
    return undefined;
  }

  try {
    return window.sessionStorage.getItem(analyticsCityStorageKey) || undefined;
  } catch {
    return undefined;
  }
}

/** "₹29,999" → 29999. Undefined when no price is stated. */
export function parsePackagePrice(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : undefined;
  }
  const digits = value?.replace(/[^\d.]/g, "");
  if (!digits) {
    return undefined;
  }
  const amount = Number(digits);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
}

function buildSafePayload(eventName: AnalyticsEventName, payload: AnalyticsPayload) {
  const safePayload: AnalyticsPayload = {};

  for (const key of allowedTextKeys) {
    const raw = payload[key];
    const safeValue = typeof raw === "string" ? sanitizeContextValue(raw) : undefined;
    if (safeValue && !looksLikeContactDetail(safeValue) && (!analyticsCampaignTextKeys.has(key) || safeAnalyticsCampaignValue(safeValue))) {
      safePayload[key] = safeValue;
    }
  }

  for (const key of allowedNumberKeys) {
    const safeValue = parsePackagePrice(payload[key]);
    if (safeValue !== undefined) {
      safePayload[key] = safeValue;
    }
  }

  const leadId = sanitizeLeadId(payload.lead_id);
  if (leadId) {
    safePayload.lead_id = leadId;
  }

  if (typeof payload.page_location === "string" && payload.page_location) {
    safePayload.page_location = sanitizePageLocation(payload.page_location);
  }

  if (!safePayload.page) {
    safePayload.page = getCurrentAnalyticsPage();
  }

  if (cityEvents.has(eventName) && !safePayload.city) {
    const city = getAnalyticsCity();
    if (city) {
      safePayload.city = city;
    }
  }

  return safePayload;
}

/**
 * Sets up gtag once, before any event is queued, so the first page_view always
 * follows its `config` command. Returns false when no Google tag is configured.
 */
export function ensureGoogleTag() {
  const measurementId = getAnalyticsMeasurementId();
  const adsId = getGoogleAdsId();
  if (!isBrowser() || (!measurementId && !adsId)) {
    return false;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      // gtag.js reads the arguments object itself, not an array copy.
      window.dataLayer?.push(arguments);
    };

  if (!window.__masonGoogleTagConfigured) {
    window.__masonGoogleTagConfigured = true;
    window.gtag("js", new Date());
    if (measurementId) {
      window.gtag("config", measurementId, { send_page_view: false });
    }
    if (adsId) {
      window.gtag("config", adsId);
    }
  }

  return true;
}

/** Standard Meta Pixel queue stub plus a single init. */
export function ensureMetaPixel() {
  const pixelId = getMetaPixelId();
  if (!isBrowser() || !pixelId) {
    return false;
  }

  if (!window.fbq) {
    const fbq = function fbqStub(...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    } as FbqFunction;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = window._fbq || fbq;
  }

  if (!window.__masonMetaPixelConfigured) {
    window.__masonMetaPixelConfigured = true;
    window.fbq("init", pixelId);
  }

  return true;
}

function sendToGoogleAds(eventName: AnalyticsEventName, payload: AnalyticsPayload) {
  const adsId = getGoogleAdsId();
  const label = getGoogleAdsLeadLabel();
  if (eventName !== "generate_lead" || !adsId || !label || !ensureGoogleTag()) {
    return;
  }

  window.gtag?.("event", "conversion", {
    send_to: `${adsId}/${label}`,
    ...(payload.lead_id ? { transaction_id: payload.lead_id } : {})
  });
}

function sendToMeta(eventName: AnalyticsEventName, payload: AnalyticsPayload) {
  if (!ensureMetaPixel()) {
    return;
  }

  const { page: _page, page_location: _location, page_title: _title, ...params } = payload;

  if (eventName === "page_view") {
    window.fbq?.("track", "PageView");
    return;
  }

  if (eventName === "generate_lead") {
    // lead_id doubles as Meta's event id so a later Conversions API event for
    // the same lead can be de-duplicated against this browser event.
    window.fbq?.("track", "Lead", params, payload.lead_id ? { eventID: String(payload.lead_id) } : undefined);
    return;
  }

  if (metaCustomEvents.has(eventName)) {
    window.fbq?.("trackCustom", eventName, params);
  }
}

export function trackAnalyticsEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  payload: AnalyticsEventMap[EventName]
) {
  if (!isBrowser() || !allowedEventNames.has(eventName)) {
    return;
  }

  let safePayload: AnalyticsPayload;
  try {
    safePayload = buildSafePayload(eventName, payload as AnalyticsPayload);
  } catch {
    return;
  }
  try {
    if (getAnalyticsMeasurementId() && ensureGoogleTag()) {
      window.gtag?.("event", eventName, safePayload);
    }
  } catch {
    // One destination must not prevent another from receiving the event.
  }
  try {
    sendToGoogleAds(eventName, safePayload);
  } catch {
    // Google Ads is independent of GA4 and Meta.
  }
  try {
    sendToMeta(eventName, safePayload);
  } catch {
    // Analytics must never affect navigation, forms, checkout, or lead creation.
  }
}

/* ---------------------------------------------------------------------------
   Page and route-visit view guards. React Strict Mode, hydration and
   remounting can repeat effects or observer callbacks during one visit. */

const PAGE_VIEW_REPEAT_WINDOW_MS = 2000;
let lastPageView: { key: string; at: number } | null = null;
let activeViewPath: string | null = null;
const viewedOnRouteVisit = new Set<string>();

/** Advance view history only when navigation reaches a different pathname. */
export function syncAnalyticsRouteVisit(pathname: string) {
  if (activeViewPath === pathname) return;
  activeViewPath = pathname;
  viewedOnRouteVisit.clear();
}

/** Tracks page_view unless this exact location was just tracked. */
export function trackPageView(now: number = Date.now()) {
  if (!isBrowser()) {
    return false;
  }

  const pageLocation = getAnalyticsPageLocation();
  const key = pageLocation || window.location.pathname;
  if (lastPageView && lastPageView.key === key && now - lastPageView.at < PAGE_VIEW_REPEAT_WINDOW_MS) {
    return false;
  }

  lastPageView = { key, at: now };

  let pageTitle: string | undefined;
  try {
    pageTitle = document.title || undefined;
  } catch {
    pageTitle = undefined;
  }

  trackAnalyticsEvent("page_view", {
    page: getCurrentAnalyticsPage(),
    page_location: pageLocation,
    page_title: pageTitle
  });
  return true;
}

/** True the first time a key is seen during the current route visit. */
export function markViewedOnce(key: string) {
  if (isBrowser()) syncAnalyticsRouteVisit(window.location.pathname);
  if (viewedOnRouteVisit.has(key)) {
    return false;
  }
  viewedOnRouteVisit.add(key);
  return true;
}

/** Test seam: forget page-view and view history. */
export function resetAnalyticsViewState() {
  lastPageView = null;
  activeViewPath = null;
  viewedOnRouteVisit.clear();
}
