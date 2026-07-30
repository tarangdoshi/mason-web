"use client";

import { useRef, useState } from "react";
import { trackAnalyticsEvent } from "../../lib/analytics";
import { getLeadAttributionContext, getQuizContext } from "../../lib/lead-context";
import { createSubmissionGate, submitGuidanceLead } from "../../lib/lead-submission";
import { EMAIL_ERROR, toCanonicalEmail } from "../../lib/email";
import { INDIAN_MOBILE_ERROR, isValidNationalMobile, toE164 } from "../../lib/phone";
import styles from "./guidance-form.module.css";
import LeadPrivacyNotice from "./lead-privacy-notice";
import LocationAutocompleteField from "./location-autocomplete-field";
import PhoneField from "./phone-field";
import { manualLocationMeta, type LocationMeta } from "../../lib/location";
import { ASSESSMENT_AVAILABILITY_COPY, type LocationMarket } from "../../lib/serviceability";

type SubmissionState = "idle" | "submitting" | "success" | "error";

const assessmentTypeLabels = {
  home_visit: "Home Visit",
  video_assessment: "Video Assessment"
} as const;

type AssessmentType = keyof typeof assessmentTypeLabels;

function isAssessmentType(value: string): value is AssessmentType {
  return value === "home_visit" || value === "video_assessment";
}

export default function AssessmentLeadForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType | "">("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const hasTrackedFormStartRef = useRef(false);
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
  }

  function handleLocationMeta(meta: LocationMeta) {
    setLocationMeta(meta);
  }

  function handlePhoneChange(nationalDigits: string) {
    setPhoneDigits(nationalDigits);
    clearFieldError("phone");
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    clearFieldError("email");
  }

  function focusField(ref: React.RefObject<HTMLInputElement | null>) {
    ref.current?.focus();
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function focusPhone() {
    focusField(phoneInputRef);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const assessmentTypeValue = assessmentType;
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

    if (!isAssessmentType(assessmentTypeValue)) {
      setSubmissionState("error");
      setErrorMessage("Choose an assessment type.");
      return;
    }

    const assessmentTypeLabel = assessmentTypeLabels[assessmentTypeValue];

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
      locationText,
      enquiryTopic: `Free Safety Assessment - ${assessmentTypeLabel}`,
      notes: String(formData.get("notes") || "") || undefined,
      metadata: {
        source: "assessment-form",
        intentCategory: "assessment",
        assessmentType: assessmentTypeValue,
        assessmentTypeLabel,
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
      form.reset();
      setPhoneDigits("");
      setEmail("");
      setAssessmentType("");
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
      const nextFieldErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.[0]) {
          nextFieldErrors[field] = messages[0];
        }
      }
      setFieldErrors(nextFieldErrors);
      setErrorMessage(nextFieldErrors.phone ? null : result.message);
      if (nextFieldErrors.phone) {
        focusPhone();
      }
      return;
    }

    setErrorMessage(result.message);
  }

  const isLocked = submissionState === "submitting" || submissionState === "success";
  const isSubmitting = submissionState === "submitting";

  return (
    <form className={styles.form} onFocusCapture={trackFormStart} onChange={trackFormStart} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label>
          <span>Name</span>
          <input type="text" name="customerName" placeholder="Your name" required disabled={isLocked} />
        </label>
        <PhoneField
          ref={phoneInputRef}
          value={phoneDigits}
          onChange={handlePhoneChange}
          disabled={isLocked}
          error={fieldErrors.phone}
          describedById="assessment-phone"
        />
        <label>
          <span>
            Email <span className={styles.requiredMark}>*</span>
          </span>
          <input
            ref={emailInputRef}
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={fieldErrors.email ? "true" : undefined}
            aria-describedby={fieldErrors.email ? "assessment-email-error" : undefined}
            required
            disabled={isLocked}
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
          />
          {fieldErrors.email ? (
            <span id="assessment-email-error" className={styles.fieldError} role="alert">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>
        <LocationAutocompleteField disabled={isLocked} formSource="assessment_form" onMeta={handleLocationMeta} />
        <p className={`${styles.fullWidth} ${styles.availabilityInfo}`}>{ASSESSMENT_AVAILABILITY_COPY}</p>
        <label className={styles.fullWidth}>
          <span>Assessment type</span>
          <select
            name="assessmentType"
            value={assessmentType}
            onChange={(event) => setAssessmentType(event.target.value as AssessmentType | "")}
            required
            disabled={isLocked}
          >
            <option value="" disabled>
              Choose assessment type
            </option>
            <option value="home_visit">Home Visit (Recommended)</option>
            <option value="video_assessment">Video Assessment</option>
          </select>
        </label>
        <label className={styles.fullWidth}>
          <span>Optional notes / concern</span>
          <textarea name="notes" rows={3} placeholder="Anything we should know before calling?" disabled={isLocked} />
        </label>
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={isLocked} aria-busy={isSubmitting}>
          {isSubmitting ? "Sending…" : submissionState === "success" ? "Request received" : "Book Free Safety Assessment"}
        </button>
      </div>
      <LeadPrivacyNotice className={styles.privacyNotice} />

      {submissionState === "success" ? (
        <p className={styles.successMessage} role="status">
          Assessment received. Mason will contact you shortly.
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
