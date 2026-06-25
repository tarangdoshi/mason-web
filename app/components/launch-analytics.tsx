"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  getAnalyticsMeasurementId,
  isAllowedAnalyticsEventName,
  trackAnalyticsEvent,
  type AnalyticsEventName
} from "../../lib/analytics";

function isWhatsappHref(href: string) {
  const normalized = href.toLowerCase();
  return normalized.includes("wa.me/") || normalized.includes("whatsapp.com/") || normalized.startsWith("whatsapp:");
}

function getContactEventName(element: HTMLAnchorElement): AnalyticsEventName | null {
  const href = element.getAttribute("href") || "";

  if (href.toLowerCase().startsWith("tel:")) {
    return "phone_click";
  }

  if (isWhatsappHref(href)) {
    return "whatsapp_click";
  }

  return null;
}

function trackElementClick(element: HTMLElement) {
  const explicitEvent = element.dataset.analyticsEvent;
  const eventName =
    explicitEvent && isAllowedAnalyticsEventName(explicitEvent)
      ? explicitEvent
      : element instanceof HTMLAnchorElement
        ? getContactEventName(element)
        : null;

  if (!eventName) {
    return;
  }

  const section = element.dataset.analyticsSection || (eventName === "phone_click" || eventName === "whatsapp_click" ? "contact" : "");
  const ctaLocation =
    element.dataset.analyticsCtaLocation || (eventName === "phone_click" || eventName === "whatsapp_click" ? "contact-link" : "");

  if (eventName === "package_cta_click") {
    trackAnalyticsEvent(eventName, {
      package: element.dataset.analyticsPackage || "unknown-package",
      cta_location: ctaLocation || "package-cta",
      section: section || "packages"
    });
    return;
  }

  if (eventName === "homepage_cta_click") {
    trackAnalyticsEvent(eventName, {
      cta_location: ctaLocation || "homepage-cta",
      section: section || "unknown-section"
    });
    return;
  }

  if (eventName === "phone_click" || eventName === "whatsapp_click") {
    trackAnalyticsEvent(eventName, {
      cta_location: ctaLocation || "contact-link",
      section: section || "contact"
    });
  }
}

function AnalyticsClickListener() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      try {
        const target = event.target;
        if (!(target instanceof Element)) {
          return;
        }

        const element = target.closest<HTMLElement>("[data-analytics-event], a[href]");
        if (!element) {
          return;
        }

        trackElementClick(element);
      } catch {
        // Analytics must never affect user interaction.
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}

function ManualPageViews() {
  const pathname = usePathname();

  useEffect(() => {
    trackAnalyticsEvent("page_view", {
      page: pathname || "/"
    });
  }, [pathname]);

  return null;
}

export default function LaunchAnalytics() {
  const measurementId = getAnalyticsMeasurementId();

  return (
    <>
      <AnalyticsClickListener />
      <ManualPageViews />
      {measurementId ? (
        <>
          <Script
            id="mason-ga4-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){window.dataLayer.push(arguments);}
                window.gtag = window.gtag || gtag;
                window.gtag('js', new Date());
                window.gtag('config', ${JSON.stringify(measurementId)}, {
                  send_page_view: false
                });
              `
            }}
          />
          <Script
            id="mason-ga4-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
            strategy="afterInteractive"
          />
        </>
      ) : null}
    </>
  );
}
