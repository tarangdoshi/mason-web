"use client";

export type AnalyticsEventMap = {
  page_view: {
    page: string;
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
};

export type AnalyticsEventName = keyof AnalyticsEventMap;

type AnalyticsPayload = Partial<Record<"page" | "package" | "cta_location" | "section", string>>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const allowedEventNames = new Set<AnalyticsEventName>([
  "page_view",
  "homepage_cta_click",
  "package_cta_click",
  "guidance_form_start",
  "guidance_lead_submit_success",
  "assessment_form_start",
  "assessment_lead_submit_success",
  "checkout_start",
  "checkout_lead_submit_success",
  "phone_click",
  "whatsapp_click"
]);

const allowedPayloadKeys = ["page", "package", "cta_location", "section"] as const;

export function getAnalyticsMeasurementId() {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
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
    return trimmed.split("?")[0]?.split("#")[0]?.slice(0, 120);
  }
}

export function getCurrentAnalyticsPage() {
  if (!isBrowser()) {
    return "/";
  }

  return sanitizeContextValue(window.location.pathname) || "/";
}

function ensureGtagStub() {
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function gtag() {
      window.dataLayer?.push(arguments);
    };
}

function buildSafePayload(payload: AnalyticsPayload) {
  const safePayload: AnalyticsPayload = {};

  for (const key of allowedPayloadKeys) {
    const safeValue = sanitizeContextValue(payload[key]);
    if (safeValue) {
      safePayload[key] = safeValue;
    }
  }

  if (!safePayload.page) {
    safePayload.page = getCurrentAnalyticsPage();
  }

  return safePayload;
}

export function trackAnalyticsEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  payload: AnalyticsEventMap[EventName]
) {
  if (!isBrowser() || !getAnalyticsMeasurementId() || !allowedEventNames.has(eventName)) {
    return;
  }

  try {
    ensureGtagStub();
    window.gtag?.("event", eventName, buildSafePayload(payload as AnalyticsPayload));
  } catch {
    // Analytics must never affect navigation, forms, checkout, or lead creation.
  }
}
