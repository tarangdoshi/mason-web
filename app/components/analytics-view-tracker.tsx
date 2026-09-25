"use client";

import { useEffect, useRef } from "react";
import { markViewedOnce, parsePackagePrice, trackAnalyticsEvent } from "../../lib/analytics";

type ViewTrackerProps =
  | { event: "view_service"; serviceName: string }
  | { event: "view_package"; packageName: string; packagePrice?: string | number };

/* Counts as viewed once half of the element is on screen — or, for sections
   taller than the viewport, once it fills half the viewport. */
function isMeaningfullyVisible(entry: IntersectionObserverEntry) {
  if (!entry.isIntersecting) {
    return false;
  }
  const viewportHeight = entry.rootBounds?.height || window.innerHeight || 0;
  return entry.intersectionRatio >= 0.5 || (viewportHeight > 0 && entry.intersectionRect.height >= viewportHeight * 0.5);
}

/**
 * Fires view_service / view_package when the element it is placed in becomes
 * visible. It renders nothing and observes its parent, so it can be dropped
 * into a server-rendered section or card without changing its markup. Fires at
 * most once per item per page view.
 */
export default function AnalyticsViewTracker(props: ViewTrackerProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const name = props.event === "view_service" ? props.serviceName : props.packageName;
  const price = props.event === "view_package" ? props.packagePrice : undefined;

  useEffect(() => {
    const target = markerRef.current?.parentElement;
    if (!target || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    let observer: IntersectionObserver | null = null;
    try {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some(isMeaningfullyVisible)) {
            return;
          }
          observer?.disconnect();
          // Keyed by path so the guard is correct whichever of this callback
          // and the new page's page_view runs first after a navigation.
          if (!markViewedOnce(`${window.location.pathname}:${props.event}:${name}`)) {
            return;
          }
          if (props.event === "view_service") {
            trackAnalyticsEvent("view_service", { service_name: name });
          } else {
            trackAnalyticsEvent("view_package", { package_name: name, package_price: parsePackagePrice(price) });
          }
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1] }
      );
      observer.observe(target);
    } catch {
      // Analytics must never affect rendering.
    }

    return () => observer?.disconnect();
  }, [props.event, name, price]);

  return <span ref={markerRef} hidden aria-hidden="true" />;
}
