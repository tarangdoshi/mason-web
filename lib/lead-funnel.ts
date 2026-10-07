"use client";

import { cityFromMarket, setAnalyticsMarket, trackAnalyticsEvent } from "./analytics";
import { getLeadAttributionContext } from "./lead-context";

/* Form names reported on form_start / form_submit / generate_lead. */
export const FORM_NAMES = {
  safetyVisit: "Safety Visit Form",
  contact: "Contact Form",
  guidance: "Guidance Form",
  checkout: "Checkout Booking Form"
} as const;

export type FormName = (typeof FORM_NAMES)[keyof typeof FORM_NAMES];

type FunnelContext = {
  packageName?: string | null;
};

type LeadSuccess = FunnelContext & {
  /** Record id returned by the Mason API for the created lead. */
  leadId?: string | null;
  /**
   * The API's id for this one enquiry (`data.enquiryId`).
   *
   * Distinct from `leadId` on purpose. `leadId` is the CRM record, which a repeat
   * customer shares across several enquiries, so counting it undercounts them. This is
   * the enquiry. Optional, so a browser running against an API that predates the field
   * still reports the lead rather than dropping the event.
   */
  enquiryId?: string | null;
  /** Location market returned by the API (GOA / BANGALORE / OTHER / UNKNOWN). */
  locationMarket?: string | null;
};

/** Why a submission the customer made did not become an enquiry. */
export type LeadFailureCategory = "validation" | "server" | "network";

/** True when a focus/change event came from a form field (not a button). */
export function isFormFieldEvent(event: { target: EventTarget | null }) {
  const target = event.target as { tagName?: unknown } | null;
  const tag = typeof target?.tagName === "string" ? target.tagName.toUpperCase() : "";
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

/** Count a submit-button click even when native validation blocks `submit`. */
export function createSubmitAttemptTracker() {
  let clickPending = false;
  let resetTimer: ReturnType<typeof setTimeout> | null = null;

  return {
    submitClick(track: () => void) {
      if (clickPending) return;
      clickPending = true;
      track();
      resetTimer = setTimeout(() => {
        clickPending = false;
        resetTimer = null;
      }, 0);
    },
    submitEvent(track: () => void) {
      if (clickPending) {
        clickPending = false;
        if (resetTimer) clearTimeout(resetTimer);
        resetTimer = null;
        return;
      }
      track();
    }
  };
}

function packageParam(packageName: string | null | undefined) {
  return packageName === "Standard" || packageName === "Advanced" ? packageName : undefined;
}

/**
 * One tracker per mounted form. It keeps the three funnel events distinct:
 *
 *   form_start    — first interaction with a field, once per form instance
 *   form_submit   — every submission attempt the visitor makes
 *   generate_lead — only after the API confirmed the lead, once per instance
 *
 * Nothing here can throw into the form: trackAnalyticsEvent swallows every
 * destination failure.
 */
export function createLeadFunnelTracker(formName: FormName) {
  let started = false;
  let leadTracked = false;

  return {
    start(context: FunnelContext = {}) {
      if (started) {
        return false;
      }
      started = true;
      trackAnalyticsEvent("form_start", { form_name: formName, package_name: packageParam(context.packageName) });
      return true;
    },

    submitAttempt(context: FunnelContext = {}) {
      trackAnalyticsEvent("form_submit", { form_name: formName, package_name: packageParam(context.packageName) });
    },

    leadCreated(result: LeadSuccess) {
      if (leadTracked) {
        return false;
      }
      leadTracked = true;
      setAnalyticsMarket(result.locationMarket);

      const attribution = getLeadAttributionContext();
      trackAnalyticsEvent("generate_lead", {
        form_name: formName,
        enquiry_id: result.enquiryId || undefined,
        lead_id: result.leadId || undefined,
        package_name: packageParam(result.packageName),
        city: cityFromMarket(result.locationMarket),
        utm_source: attribution?.utmSource,
        utm_medium: attribution?.utmMedium,
        utm_campaign: attribution?.utmCampaign,
        // utm_term stays out of analytics on purpose — see lib/analytics.ts. It reaches
        // Zoho's UTM_Term field in full, which is where the keyword can be read.
        utm_content: attribution?.utmContent,
        gclid: attribution?.gclid,
        gbraid: attribution?.gbraid,
        wbraid: attribution?.wbraid,
        fbclid: attribution?.fbclid
      });
      return true;
    },

    /**
     * Records a submission the customer made that the API refused or never received.
     *
     * Deliberately not latched: every refused attempt is reported, mirroring
     * form_submit, so the submit-to-success gap is visible per attempt rather than
     * per form. Only the category travels — never the server's message.
     */
    submitFailed(category: LeadFailureCategory, context: FunnelContext = {}) {
      trackAnalyticsEvent("form_error", {
        form_name: formName,
        error_category: category,
        package_name: packageParam(context.packageName)
      });
    }
  };
}

export type LeadFunnelTracker = ReturnType<typeof createLeadFunnelTracker>;
