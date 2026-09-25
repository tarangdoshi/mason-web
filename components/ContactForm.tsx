"use client";

import { useRef, useState } from "react";
import { ctaClass } from "./Cta";
import { ArrowForward } from "./Icon";
import { EMAIL_ERROR, toCanonicalEmail } from "../lib/email";
import { INDIAN_MOBILE_ERROR, formatNationalMobile, isValidNationalMobile, sanitizePhoneInput } from "../lib/phone";
import { createSubmissionGate, resolveValidationFeedback, submitGuidanceLead } from "../lib/lead-submission";
import { getLeadAttributionContext, getQuizContext } from "../lib/lead-context";
import { manualLocationMeta, type LocationMeta } from "../lib/location";
import { setAnalyticsMarket, trackAnalyticsEvent } from "../lib/analytics";
import { createLeadFunnelTracker, createSubmitAttemptTracker, FORM_NAMES, isFormFieldEvent, type LeadFunnelTracker } from "../lib/lead-funnel";
import LeadPrivacyNotice from "../app/components/lead-privacy-notice";
import LocationField from "./LocationField";
import ServiceArea from "./ServiceArea";

type Values = {
  name: string;
  mobile: string;
  email: string;
  packageInterest: string;
};

const EMPTY: Values = {
  name: "",
  mobile: "",
  email: "",
  packageInterest: "",
};

/* Only these three block submission. The package is a nice-to-have, and
   pressing someone to commit to one before they have spoken to us is the
   fastest way to lose the enquiry. Location is likewise optional — see
   LocationField, which mirrors the home page assessment form's address
   capture (Google Places autocomplete + "use my location"). */
type Required = "name" | "mobile" | "email";
type Errors = Partial<Record<Required, string>>;

// In visual/tab order, so the first invalid field is the one focused — same
// convention as the home page assessment form.
const FIELD_ORDER: Required[] = ["name", "email", "mobile"];

// Maps the API's field-error keys (public-leads schema: customerName/phone/
// email) onto this form's own field names, so a server-side validation error
// (e.g. a duplicate-enquiry check the client can't run) lands on the right
// input the same way a client-side error does.
const SERVER_FIELD_TO_LOCAL: Record<string, Required> = {
  customerName: "name",
  phone: "mobile",
  email: "email",
};
const INLINE_ERROR_FIELD_ORDER = ["customerName", "email", "phone"] as const;

function validate(v: Values): Errors {
  const errors: Errors = {};
  if (v.name.trim().length < 2) errors.name = "Please enter your full name.";
  if (!isValidNationalMobile(v.mobile)) errors.mobile = INDIAN_MOBILE_ERROR;
  if (!toCanonicalEmail(v.email)) errors.email = EMAIL_ERROR;
  return errors;
}

const LABEL = "block text-sm font-semibold text-cream";
const OPTIONAL = "ml-1.5 text-xs font-normal text-sand-400";

/* The card is white, so fields go one step DOWN the elevation ladder into
   sand-100 — the inverse of the booking dialog, where a sand-50 dialog holds
   white fields. Either way the field reads as recessed. */
const FIELD =
  "mt-2 w-full rounded-xl border bg-sand-100 px-4 py-3 text-base text-cream transition-colors duration-150";
const INPUT = `${FIELD} placeholder:text-sand-400 focus:outline-none`;
/* The mobile field wraps a static +91, so its active state comes from the
   container (focus-within) rather than the input itself. */
const GROUP = `${FIELD} flex items-center gap-2.5`;

/* Reserved under EVERY field, not just the three that can error — it keeps
   each grid row the same height and stops the card growing on submit. */
const ERROR = "mt-1.5 min-h-4 text-xs leading-4 text-brick";

const PACKAGES = ["Standard", "Advanced", "Not sure yet"];

export default function ContactForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Field errors the server caught that our own client-side checks don't
  // (e.g. a duplicate-enquiry rule). Kept separate from the derived `errors`
  // below so a stale server message doesn't linger once the field is edited.
  const [serverFieldErrors, setServerFieldErrors] = useState<Errors>({});
  const [locationMeta, setLocationMeta] = useState<LocationMeta | null>(null);
  // Bumped on "Send another enquiry" to remount LocationField, clearing its
  // internal address text/hint — that state lives inside the field, not here.
  const [formGeneration, setFormGeneration] = useState(0);
  const gate = useRef(createSubmissionGate());
  const funnel = useRef<LeadFunnelTracker | null>(null);
  funnel.current ??= createLeadFunnelTracker(FORM_NAMES.contact);
  const submitAttempt = useRef(createSubmitAttemptTracker());
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs: Record<Required, React.RefObject<HTMLInputElement | null>> = {
    name: nameInputRef,
    email: emailInputRef,
    mobile: mobileInputRef,
  };
  const trackStart = (event: React.SyntheticEvent) => {
    if (isFormFieldEvent(event)) funnel.current?.start({ packageName: values.packageInterest });
  };

  // Nothing is flagged until the first submit attempt — validating on blur
  // scolds people for fields they have simply not finished yet. Derived rather
  // than stored, so once errors ARE showing they clear live as you fix them.
  // Server-side field errors are merged in on top, and cleared per-field as
  // soon as the visitor edits that field again (see `set` below).
  const errors: Errors = submitted ? { ...validate(values), ...serverFieldErrors } : {};

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key === "name" || key === "email" || key === "mobile") {
      setServerFieldErrors((current) => {
        if (!current[key as Required]) return current;
        const next = { ...current };
        delete next[key as Required];
        return next;
      });
    }
  };

  function handleLocationMeta(meta: LocationMeta) {
    setLocationMeta(meta);
    setAnalyticsMarket(meta.serviceability.locationMarket);
  }

  function focusField(ref: React.RefObject<HTMLInputElement | null> | undefined) {
    ref?.current?.focus();
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function focusFirstInvalid(errs: Errors) {
    const first = FIELD_ORDER.find((field) => errs[field]);
    if (first) focusField(fieldRefs[first]);
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    // Every attempt counts as form_submit, including one stopped by the
    // checks below; generate_lead waits for the API's confirmation.
    submitAttempt.current.submitEvent(trackSubmitAttempt);
    setSubmitted(true);
    const clientErrors = validate(values);
    if (Object.keys(clientErrors).length > 0) {
      focusFirstInvalid(clientErrors);
      return;
    }

    if (!gate.current.tryBegin()) return;
    setBusy(true);
    setError(null);
    setServerFieldErrors({});

    // The location field manages its own typed text internally (see
    // LocationField/useLocationAutocomplete); read the current value straight
    // off the form the same way the assessment form does.
    const formData = new FormData(form);
    const locationText = String(formData.get("locationText") || "");
    const resolvedLocationMeta = locationMeta ?? manualLocationMeta(locationText);

    if (resolvedLocationMeta.source === "manual") {
      trackAnalyticsEvent("location_picker_fallback", {
        market: "UNKNOWN",
        form_source: "contact_form",
      });
    }

    const result = await submitGuidanceLead({
      customerName: values.name.trim(), phone: `+91${values.mobile}`, email: toCanonicalEmail(values.email),
      locationText: locationText.trim().length >= 2 ? locationText : "Address not provided",
      enquiryTopic: values.packageInterest ? `Package enquiry - ${values.packageInterest}` : "Contact enquiry",
      metadata: { source: "contact-form", intentCategory: "guidance", packageInterest: values.packageInterest,
        location: resolvedLocationMeta, locationMarket: resolvedLocationMeta.serviceability.locationMarket, serviceability: resolvedLocationMeta.serviceability,
        attribution: getLeadAttributionContext({entryPoint:"contact-form", packageName: values.packageInterest || undefined}), quiz: getQuizContext() }
    });
    setBusy(false);
    if (result.ok) {
      gate.current.complete(); setDone(true);
      funnel.current?.leadCreated({ leadId: result.leadId, locationMarket: result.locationMarket, packageName: values.packageInterest });
      trackAnalyticsEvent("guidance_lead_submit_success", {cta_location:"contact-form", section:"contact"});
      return;
    }

    gate.current.release();

    if (result.kind === "validation") {
      const feedback = resolveValidationFeedback(result, INLINE_ERROR_FIELD_ORDER);
      const mapped: Errors = {};
      for (const [field, message] of Object.entries(feedback.fieldErrors)) {
        const local = SERVER_FIELD_TO_LOCAL[field];
        if (local) mapped[local] = message;
      }
      setServerFieldErrors(mapped);
      setError(feedback.bannerMessage);
      const localFocus = feedback.focusField ? SERVER_FIELD_TO_LOCAL[feedback.focusField] : null;
      if (localFocus) focusField(fieldRefs[localFocus]);
      return;
    }

    setError(result.message);
  };

  function trackSubmitAttempt() {
    if (!gate.current.isCompleted && !gate.current.isInFlight) {
      funnel.current?.submitAttempt({ packageName: values.packageInterest });
    }
  }

  /* Active state is the border itself going green — same 1px stroke as at
     rest, so nothing thickens or shifts. The global 2px offset outline is
     suppressed for form fields in globals.css. */
  const border = (field: Required) =>
    errors[field] ? "border-brick" : "border-sand-200 focus:border-forest-700";

  const groupBorder = (field: Required) =>
    errors[field]
      ? "border-brick"
      : "border-sand-200 focus-within:border-forest-700";

  const describedBy = (field: Required) =>
    errors[field] ? `contact-${field}-error` : undefined;

  return (
    /* One shell for both states, with the form and the confirmation stacked in
       the same grid cell. The form stays mounted once submitted - only
       visibility:hidden - so the card keeps the form's height instead of
       collapsing to whatever the confirmation happens to need. Hidden
       visibility also drops the fields out of the tab order and the
       accessibility tree, so nothing is reachable behind the confirmation. */
    <div className="grid rounded-3xl border border-line bg-ink-raised p-6 sm:p-8 lg:p-10">
      <form
        onSubmit={onSubmit}
        onFocusCapture={trackStart}
        onChangeCapture={trackStart}
        noValidate
        className={`col-start-1 row-start-1 ${done ? "invisible" : ""}`}
      >
        <div className="grid gap-x-5 gap-y-1 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className={LABEL}>
              Full name
              <span aria-hidden="true" className="text-brick">
                *
              </span>
            </label>
            <input
              id="contact-name"
              name="name"
              ref={nameInputRef}
              autoComplete="name"
              required
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              aria-invalid={!!errors.name}
              aria-describedby={describedBy("name")}
              placeholder="Priya Sharma"
              className={`${INPUT} ${border("name")}`}
            />
            <p id="contact-name-error" aria-live="polite" className={ERROR}>
              {errors.name}
            </p>
          </div>

          <div>
            <label htmlFor="contact-email" className={LABEL}>
              Email address
              <span aria-hidden="true" className="text-brick">
                *
              </span>
            </label>
            <input
              id="contact-email"
              name="email"
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              required
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={describedBy("email")}
              placeholder="priya@example.com"
              className={`${INPUT} ${border("email")}`}
            />
            <p id="contact-email-error" aria-live="polite" className={ERROR}>
              {errors.email}
            </p>
          </div>

          <div>
            <label htmlFor="contact-mobile" className={LABEL}>
              Mobile number
              <span aria-hidden="true" className="text-brick">
                *
              </span>
            </label>
            <div className={`${GROUP} ${groupBorder("mobile")}`}>
              <span
                aria-hidden="true"
                className="shrink-0 select-none text-base text-sand-600"
              >
                +91
              </span>
              <span aria-hidden="true" className="h-5 w-px bg-sand-200" />
              <input
                id="contact-mobile"
                name="mobile"
                ref={mobileInputRef}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                value={formatNationalMobile(values.mobile)}
                onChange={(e) => set("mobile", sanitizePhoneInput(e.target.value))}
                aria-invalid={!!errors.mobile}
                aria-describedby={describedBy("mobile")}
                placeholder="98765 43210"
                className="w-full bg-transparent text-base text-cream placeholder:text-sand-400 focus:outline-none"
              />
            </div>
            <p id="contact-mobile-error" aria-live="polite" className={ERROR}>
              {errors.mobile}
            </p>
          </div>

          <div>
            <label htmlFor="contact-package" className={LABEL}>
              Package you&rsquo;re considering
              <span className={OPTIONAL}>optional</span>
            </label>
            {/* appearance-none + our own chevron: the native arrow is a different
                grey on every platform and sat outside the design system. */}
            <div className="relative">
              <select
                id="contact-package"
                name="package"
                value={values.packageInterest}
                onChange={(e) => set("packageInterest", e.target.value)}
                className={`${FIELD} appearance-none border-sand-200 pr-11 focus:border-forest-700 focus:outline-none ${
                  values.packageInterest ? "" : "text-sand-400"
                }`}
              >
                <option value="">Choose a package</option>
                {PACKAGES.map((p) => (
                  <option key={p} value={p} className="text-cream">
                    {p}
                  </option>
                ))}
              </select>
              {/* mt-2 on the field means the chevron centres on the field, not
                  the label + field box. */}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-2 h-[calc(100%-0.5rem)] w-4 text-sand-400"
                fill="none"
              >
                <path
                  d="M7 10l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className={ERROR} />
          </div>

          <LocationField
            key={formGeneration}
            disabled={busy || done}
            onMeta={handleLocationMeta}
            className="sm:col-span-2"
          />
        </div>

      {/* col-reverse, so the DOM order that gives text-left / button-right on
          desktop stacks the other way round on mobile - the button belongs
          directly under the last field, not beneath a paragraph of fine print.
          items-center because the text runs to three lines against a one-line
          button. */}
        <div className="mt-6 flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <ServiceArea className="max-w-sm" />

          <button
            type="submit"
            onClick={() => submitAttempt.current.submitClick(trackSubmitAttempt)}
            disabled={busy || done}
            /* justify-center: stacked, this is a flex item in a column, so it
               stretches to the full width while its own justify-content stays
               at the default — label and arrow bunched against the left edge of
               a 277px button. A no-op from sm, where shrink-0 in a row sizes it
               to its content again. */
            className={ctaClass({
              className: "shrink-0 justify-center disabled:opacity-70",
            })}
          >
            {busy ? "Sending…" : "Send my enquiry"}
            <ArrowForward
              size={19}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        </div>
        <LeadPrivacyNotice />
        {error && <p role="alert" className="mt-4 text-brick">{error}</p>}
      </form>

      {done && (
        <div className="col-start-1 row-start-1 grid place-content-center text-center">
          <h2 className="h-display text-3xl text-cream sm:text-4xl">
            We&rsquo;ll be in <span className="accent-word">touch</span>.
          </h2>
          <p className="mx-auto mt-5 max-w-sm text-base leading-relaxed text-sand-600">
            Thanks {values.name.trim().split(" ")[0]} - a Mason advisor will
            call you on{" "}
            {/* nowrap so the number never splits across two lines */}
            <span className="whitespace-nowrap font-semibold text-cream">
              +91 {values.mobile}
            </span>{" "}
            within 24 hours.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setValues(EMPTY);
                setSubmitted(false);
                setDone(false); gate.current = createSubmissionGate(); setError(null);
                setServerFieldErrors({});
                setLocationMeta(null);
                setFormGeneration((g) => g + 1);
              }}
              className={ctaClass({ variant: "outline" })}
            >
              Send another enquiry
              <ArrowForward
                size={19}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
