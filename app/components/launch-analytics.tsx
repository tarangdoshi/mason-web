"use client";

import Script from "next/script";
import { storeLeadCtaContext } from "../../lib/lead-context";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  ensureGoogleTag,
  ensureMetaPixel,
  getGoogleTagLoaderId,
  getMetaPixelId,
  isAllowedAnalyticsEventName,
  parsePackagePrice,
  trackAnalyticsEvent,
  trackPageView,
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
    // Package CTAs that name the package are also a select_package.
    if (element.dataset.analyticsPackageName) {
      trackAnalyticsEvent("select_package", {
        package_name: element.dataset.analyticsPackageName,
        package_price: parsePackagePrice(element.dataset.analyticsPackagePrice)
      });
    }
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
    storeLeadCtaContext({});
    // Deferred a tick so document.title reflects the new route; the timer is
    // cleared if Strict Mode or a remount re-runs this effect, and
    // trackPageView ignores an immediate repeat of the same location.
    const timer = window.setTimeout(() => {
      try {
        trackPageView();
      } catch {
        // Analytics must never affect navigation.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

export default function LaunchAnalytics() {
  const googleTagId = getGoogleTagLoaderId();
  const metaPixelId = getMetaPixelId();

  useEffect(() => {
    // Queue gtag/fbq configuration before any event, whichever loads first.
    try {
      ensureGoogleTag();
      ensureMetaPixel();
    } catch {
      // Analytics must never affect rendering.
    }
  }, []);

  return (
    <>
      <AnalyticsClickListener />
      <ManualPageViews />
      {googleTagId ? (
        <Script
          id="mason-google-tag-src"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleTagId)}`}
          strategy="afterInteractive"
        />
      ) : null}
      {metaPixelId ? (
        <Script id="mason-meta-pixel-src" src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" />
      ) : null}
    </>
  );
}
