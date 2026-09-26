"use client";

import { useId, useRef, useState } from "react";
import LeadPrivacyNotice from "./lead-privacy-notice";
import { setAnalyticsMarket, trackAnalyticsEvent } from "../../lib/analytics";
import { createLeadFunnelTracker, createSubmitAttemptTracker, FORM_NAMES, isFormFieldEvent, type LeadFunnelTracker } from "../../lib/lead-funnel";
import { getLeadAttributionContext, getQuizContext } from "../../lib/lead-context";
import { createSubmissionGate, resolveValidationFeedback, submitGuidanceLead } from "../../lib/lead-submission";
import { EMAIL_ERROR, toCanonicalEmail } from "../../lib/email";
import { INDIAN_MOBILE_ERROR, isValidNationalMobile, toE164 } from "../../lib/phone";
import styles from "./guidance-form.module.css";
import LocationAutocompleteField from "./location-autocomplete-field";
import PhoneField from "./phone-field";
import { manualLocationMeta, type LocationMeta } from "../../lib/location";
import { ASSESSMENT_AVAILABILITY_COPY, type LocationMarket } from "../../lib/serviceability";

type SubmissionState = "idle" | "submitting" | "success" | "error";

// Fields that render their own inline error, in the form's visual order. A new
// one is added here plus its inline markup — the server-error handling below
// stays field-agnostic.
const INLINE_ERROR_FIELD_ORDER = ["phone", "email"] as const;

export default function AssessmentLeadForm({ packageName }: { packageName?: string } = {}) {
  const formId = useId();
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phoneDigits, setPhoneDigits] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasTrackedFormStartRef = useRef(false);
  const funnelRef = useRef<LeadFunnelTracker | null>(null);
  funnelRef.current ??= createLeadFunnelTracker(FORM_NAMES.safetyVisit);
  const submitAttemptRef = useRef(createSubmitAttemptTracker());
  const gateRef = useRef(createSubmissionGate());
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [locationMeta, setLocationMeta] = useState<LocationMeta | null>(null);

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function trackFormStart() {
    if (hasTrackedFormStartRef.current) {
      return;
    }

    hasTrackedFormStartRef.current = true;
    trackAnalyticsEvent("assessment_form_start", {
      cta_location: "assessment-form",
      section: "free-assessment"
    });
    funnelRef.current?.start({ packageName });
  }

  function handleLocationMeta(meta: LocationMeta) {
    setLocationMeta(meta);
    setAnalyticsMarket(meta.serviceability.locationMarket);
  }

  function handlePhoneChange(nationalDigits: string) {
    setPhoneDigits(nationalDigits);
    clearFieldError("phone");
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    clearFieldError("email");
  }

  function focusField(ref: React.RefObject<HTMLInputElement | null> | undefined) {
    ref?.current?.focus();
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function focusPhone() {
    focusField(phoneInputRef);
  }

  const inlineFieldRefs: Record<string, React.RefObject<HTMLInputElement | null>> = {
    phone: phoneInputRef,
    email: emailInputRef
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // form_submit is every attempt, including ones the checks below stop;
    // generate_lead fires only once the API has confirmed the lead.
    submitAttemptRef.current.submitEvent(trackSubmitAttempt);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const locationText = String(formData.get("locationText") || "");
    const resolvedLocationMeta = locationMeta ?? manualLocationMeta(locationText);

    // These checks mirror the API contract for fast feedback; the API
    // re-validates every submission and remains the authority.
    const phoneE164 = isValidNationalMobile(phoneDigits) ? toE164(phoneDigits) : null;
    if (!phoneE164) {
      setFieldErrors((current) => ({ ...current, phone: INDIAN_MOBILE_ERROR }));
      setSubmissionState("error");
      setErrorMessage(null);
      focusPhone();
      return;
    }

    // Checked in field order, so the first invalid field is the one focused.
    const canonicalEmail = toCanonicalEmail(email);
    if (!canonicalEmail) {
      setFieldErrors((current) => ({ ...current, email: EMAIL_ERROR }));
      setSubmissionState("error");
      setErrorMessage(null);
      focusField(emailInputRef);
      return;
    }

    if (resolvedLocationMeta.source === "manual") {
      trackAnalyticsEvent("location_picker_fallback", {
        market: "UNKNOWN",
        form_source: "assessment_form"
      });
    }

    // Refuses a second submission while one is in flight, and permanently once
    // a lead has been created, so repeated clicks cannot duplicate a lead.
    if (!gateRef.current.tryBegin()) {
      return;
    }

    setSubmissionState("submitting");
    setErrorMessage(null);
    setFieldErrors({});

    const payload = {
      customerName: String(formData.get("customerName") || ""),
      phone: phoneE164,
      email: canonicalEmail,
      locationText: locationText.trim().length >= 2 ? locationText : "Address not provided",
      // The API requires a topic for the ENQUIRY record. The public form has
      // no topic selector, so this neutral value describes the requested visit
      // without inventing an assessment type or customer concern.
      enquiryTopic: "Bathroom safety visit",
      metadata: {
        source: "assessment-form",
        intentCategory: "assessment",
        locationMarket: resolvedLocationMeta.serviceability.locationMarket,
        serviceability: resolvedLocationMeta.serviceability,
        location: resolvedLocationMeta,
        attribution: getLeadAttributionContext({
          entryPoint: "assessment-form",
          pageSection: "free-assessment",
          ctaId: "book-free-safety-assessment"
        }),
        quiz: getQuizContext()
      }
    };

    const result = await submitGuidanceLead(payload);

    if (result.ok) {
      gateRef.current.complete();
      funnelRef.current?.leadCreated({ leadId: result.leadId, locationMarket: result.locationMarket, packageName });
      form.reset();
      setPhoneDigits("");
      setEmail("");
      setLocationMeta(null);
      trackAnalyticsEvent("assessment_lead_submit_success", {
        cta_location: "assessment-form",
        section: "free-assessment"
      });
      trackAnalyticsEvent("lead_location_market", {
        market: (result.locationMarket as LocationMarket) || "UNKNOWN",
        form_source: "assessment_form"
      });
      setSubmissionState("success");
      return;
    }

    // Failure: release the gate and keep every entered value so the customer
    // can correct one field and retry without re-typing the rest.
    gateRef.current.release();
    setSubmissionState("error");

    if (result.kind === "validation") {
      const feedback = resolveValidationFeedback(result, INLINE_ERROR_FIELD_ORDER);
      setFieldErrors(feedback.fieldErrors);
      setErrorMessage(feedback.bannerMessage);
      if (feedback.focusField) {
        focusField(inlineFieldRefs[feedback.focusField]);
      }
      return;
    }

    setErrorMessage(result.message);
  }

  function trackSubmitAttempt() {
    if (!gateRef.current.isCompleted && !gateRef.current.isInFlight) {
      funnelRef.current?.submitAttempt({ packageName });
    }
  }

  const isLocked = submissionState === "submitting" || submissionState === "success";
  const isSubmitting = submissionState === "submitting";

  return (
    <form
      className={styles.form}
      onFocusCapture={(event) => isFormFieldEvent(event) && trackFormStart()}
      onChange={(event) => isFormFieldEvent(event) && trackFormStart()}
      onSubmit={handleSubmit}
    >
      <div className={styles.grid}>
        <label>
          <span>
            Full name <span className={styles.requiredMark}>*</span>
          </span>
          <input type="text" name="customerName" placeholder="Your name" required disabled={isLocked} />
        </label>
        <PhoneField
          ref={phoneInputRef}
          value={phoneDigits}
          onChange={handlePhoneChange}
          disabled={isLocked}
          error={fieldErrors.phone}
          describedById={`assessment-phone-${formId}`}
        />
        <label>
          <span>
            Email address <span className={styles.requiredMark}>*</span>
          </span>
          <input
            ref={emailInputRef}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email ? "true" : undefined}
            aria-describedby={fieldErrors.email ? `assessment-email-error-${formId}` : undefined}
            required
            disabled={isLocked}
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
          />
          {fieldErrors.email ? (
            <span id={`assessment-email-error-${formId}`} className={styles.fieldError} role="alert">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>
        <LocationAutocompleteField disabled={isLocked} formSource="assessment_form" onMeta={handleLocationMeta} />
        <p className={`${styles.fullWidth} ${styles.availabilityInfo}`}>{ASSESSMENT_AVAILABILITY_COPY}</p>
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={isLocked} aria-busy={isSubmitting} onClick={() => submitAttemptRef.current.submitClick(trackSubmitAttempt)}>
          {isSubmitting ? "Sending…" : submissionState === "success" ? "Request received" : "Confirm Free Inspection"}
        </button>
      </div>
      <LeadPrivacyNotice className={styles.privacyNotice} />

      {submissionState === "success" ? (
        <p className={styles.successMessage} role="status">
          Visit request received. Mason will contact you shortly.
        </p>
      ) : null}
      {submissionState === "error" && errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
