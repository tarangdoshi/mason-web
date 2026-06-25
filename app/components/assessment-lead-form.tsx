"use client";

import { useRef, useState } from "react";
import { trackAnalyticsEvent } from "../../lib/analytics";
import { getLeadAttributionContext, getQuizContext } from "../../lib/lead-context";
import styles from "./guidance-form.module.css";
import LeadPrivacyNotice from "./lead-privacy-notice";
import LocationAutocompleteField from "./location-autocomplete-field";
import type { LocationMeta } from "../../lib/location";

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
  const hasTrackedFormStartRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const submittedLeadIdRef = useRef<string | null>(null);
  const locationMetaRef = useRef<LocationMeta | null>(null);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmittingRef.current || submittedLeadIdRef.current) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const assessmentTypeValue = String(formData.get("assessmentType") || "");

    if (!isAssessmentType(assessmentTypeValue)) {
      setSubmissionState("error");
      setErrorMessage("Choose an assessment type.");
      return;
    }

    const assessmentTypeLabel = assessmentTypeLabels[assessmentTypeValue];

    isSubmittingRef.current = true;
    setSubmissionState("submitting");
    setErrorMessage(null);

    const payload = {
      customerName: String(formData.get("customerName") || ""),
      phone: String(formData.get("phone") || ""),
      locationText: String(formData.get("locationText") || ""),
      enquiryTopic: `Free Safety Assessment - ${assessmentTypeLabel}`,
      notes: String(formData.get("notes") || "") || undefined,
      metadata: {
        source: "assessment-form",
        intentCategory: "assessment",
        assessmentType: assessmentTypeValue,
        assessmentTypeLabel,
        location: locationMetaRef.current ?? undefined,
        attribution: getLeadAttributionContext({
          entryPoint: "assessment-form",
          pageSection: "free-assessment",
          ctaId: "book-free-safety-assessment"
        }),
        quiz: getQuizContext()
      }
    };

    try {
      const response = await fetch("/api/leads/guidance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Unable to submit your assessment request.");
      }

      const responsePayload = (await response.json()) as { data?: { id?: string } };
      submittedLeadIdRef.current = responsePayload.data?.id || "captured";
      form.reset();
      trackAnalyticsEvent("assessment_lead_submit_success", {
        cta_location: "assessment-form",
        section: "free-assessment"
      });
      setSubmissionState("success");
    } catch (error) {
      setSubmissionState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit your assessment request.");
      isSubmittingRef.current = false;
      return;
    }

    isSubmittingRef.current = false;
  }

  const isLocked = submissionState === "submitting" || submissionState === "success";

  return (
    <form className={styles.form} onFocusCapture={trackFormStart} onChange={trackFormStart} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label>
          <span>Name</span>
          <input type="text" name="customerName" placeholder="Your name" required disabled={isLocked} />
        </label>
        <label>
          <span>Phone</span>
          <input type="tel" name="phone" placeholder="+91 98..." required disabled={isLocked} />
        </label>
        <LocationAutocompleteField disabled={isLocked} onMeta={(meta) => { locationMetaRef.current = meta; }} />
        <label className={styles.fullWidth}>
          <span>Assessment type</span>
          <select name="assessmentType" defaultValue="" required disabled={isLocked}>
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
        <button type="submit" disabled={isLocked}>
          {submissionState === "submitting" ? "Sending..." : submissionState === "success" ? "Request received" : "Book Free Safety Assessment"}
        </button>
      </div>
      <LeadPrivacyNotice className={styles.privacyNotice} />

      {submissionState === "success" ? (
        <p className={styles.successMessage}>Your free safety assessment request is in. Mason will contact you shortly to schedule it.</p>
      ) : null}
      {submissionState === "error" && errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
    </form>
  );
}
