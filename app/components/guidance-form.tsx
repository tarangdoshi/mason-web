"use client";

import { useRef, useState } from "react";
import { trackAnalyticsEvent } from "../../lib/analytics";
import { getLeadAttributionContext, getQuizContext } from "../../lib/lead-context";
import styles from "./guidance-form.module.css";
import LeadPrivacyNotice from "./lead-privacy-notice";

type SubmissionState = "idle" | "submitting" | "success" | "error";

export default function GuidanceForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasTrackedFormStartRef = useRef(false);

  function trackFormStart() {
    if (hasTrackedFormStartRef.current) {
      return;
    }

    hasTrackedFormStartRef.current = true;
    trackAnalyticsEvent("guidance_form_start", {
      cta_location: "guidance-form",
      section: "guidance-form"
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionState("submitting");
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const payload = {
      customerName: String(formData.get("customerName") || ""),
      phone: String(formData.get("phone") || ""),
      city: String(formData.get("city") || "") || undefined,
      locationText: String(formData.get("locationText") || ""),
      enquiryTopic: String(formData.get("enquiryTopic") || ""),
      preferredCallbackAt: String(formData.get("preferredCallbackAt") || "") || null,
      notes: String(formData.get("notes") || "") || undefined,
      metadata: {
        source: "guidance-form",
        intentCategory: "guidance",
        attribution: getLeadAttributionContext({
          entryPoint: "guidance-form",
          pageSection: "guidance-form",
          ctaId: "request-guidance"
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
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to submit your request.");
      }

      event.currentTarget.reset();
      trackAnalyticsEvent("guidance_lead_submit_success", {
        cta_location: "guidance-form",
        section: "guidance-form"
      });
      setSubmissionState("success");
    } catch (error) {
      setSubmissionState("error");
      setErrorMessage(error instanceof Error ? error.message : "Unable to submit your request.");
    }
  }

  return (
    <form className={styles.form} onFocusCapture={trackFormStart} onChange={trackFormStart} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <label>
          <span>Name</span>
          <input type="text" name="customerName" placeholder="Your name" required />
        </label>
        <label>
          <span>Phone</span>
          <input type="tel" name="phone" placeholder="+91 98..." required />
        </label>
        <label>
          <span>City</span>
          <select name="city" defaultValue="">
            <option value="">Select city</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Goa">Goa</option>
          </select>
        </label>
        <label>
          <span>Preferred callback</span>
          <input type="datetime-local" name="preferredCallbackAt" />
        </label>
        <label className={styles.fullWidth}>
          <span>Area or locality</span>
          <input type="text" name="locationText" placeholder="Andheri West, Panaji, or your area" required />
        </label>
        <label className={styles.fullWidth}>
          <span>Enquiry topic</span>
          <input type="text" name="enquiryTopic" placeholder="Package help, site visit, pricing, support..." required />
        </label>
        <label className={styles.fullWidth}>
          <span>Notes</span>
          <textarea name="notes" rows={3} placeholder="Anything we should know before calling?" />
        </label>
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={submissionState === "submitting"}>
          {submissionState === "submitting" ? "Sending..." : "Request guidance"}
        </button>
      </div>
      <LeadPrivacyNotice className={styles.privacyNotice} />

      {submissionState === "success" ? (
        <p className={styles.successMessage}>Your request is in. An Aegis specialist will follow up shortly.</p>
      ) : null}
      {submissionState === "error" && errorMessage ? <p className={styles.errorMessage}>{errorMessage}</p> : null}
    </form>
  );
}
