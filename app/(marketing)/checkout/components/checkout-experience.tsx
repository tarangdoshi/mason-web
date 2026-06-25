"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LeadPrivacyNotice from "../../../components/lead-privacy-notice";
import type { PackageCatalogEntry } from "../../../../content/package-catalog";
import CmsImage from "../../../components/cms-image";
import type { PackageFeatureItem } from "../../../../content/types";
import { trackAnalyticsEvent } from "../../../../lib/analytics";
import { getLeadAttributionContext, getQuizContext } from "../../../../lib/lead-context";
import styles from "../checkout.module.css";

type CheckoutExperienceProps = {
  entry: PackageCatalogEntry;
  includedFeatures: PackageFeatureItem[];
  excludedFeatures: PackageFeatureItem[];
  addOnFeatures: PackageFeatureItem[];
};

type PaymentChoice = "online" | "installation";
type ServiceArea = "Mumbai Metro" | "Goa";
type LocationSource = "geolocation" | "manual";

type LocationResolution =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "serviceable";
      source: LocationSource;
      label: string;
      details: string;
      serviceArea: ServiceArea;
      latitude?: number;
      longitude?: number;
    }
  | {
      status: "unserviceable";
      source: LocationSource;
      label: string;
      details: string;
    }
  | {
      status: "error";
      message: string;
    };

type ReviewState = {
  name: string;
  phone: string;
  locationLabel: string;
  serviceArea: ServiceArea;
  date: string;
  slot: string;
  paymentChoice: PaymentChoice;
  amcSelected: boolean;
  amcAmount: number | null;
  installationFee: number;
  totalPayable: number | null;
};

type ReverseGeocodeResponse = {
  display_name?: string;
  address?: Record<string, string | undefined>;
};

const SERVICE_UNAVAILABLE_MESSAGE = "Service currently not available in your area, we will be there soon.";
const PAY_ON_INSTALLATION_SURCHARGE = 500;
const AMC_RATE = 0.15;
const slotOptions = ["9am - 12pm", "12pm - 3pm", "3pm - 6pm"];
const mumbaiTokens = [
  "mumbai",
  "bombay",
  "greater mumbai",
  "mumbai suburban",
  "navi mumbai",
  "thane",
  "mira bhayandar",
  "mira-bhayandar",
  "vasai",
  "virar",
  "vasai-virar",
  "panvel",
  "kalyan",
  "dombivli",
  "bhiwandi"
];
const goaTokens = ["goa", "north goa", "south goa", "panaji", "mapusa", "margao", "madgaon", "vasco", "porvorim"];
const defaultAmcBenefits = [
  "Periodic post-installation health check of installed support points",
  "Re-tightening and alignment review of key fittings",
  "Wear-and-tear inspection for daily-use safety components",
  "Priority follow-up support scheduling"
];

function formatDate(rawDate: string) {
  if (!rawDate) {
    return "Select a preferred date";
  }

  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function parsePriceAmount(rawPrice: string) {
  const digits = rawPrice.replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function formatAmount(amount: number | null) {
  return amount === null ? "To be confirmed" : formatCurrency(amount);
}

function sanitizePhone(rawPhone: string) {
  return rawPhone.replace(/\D/g, "").slice(0, 10);
}

function detectServiceArea(rawText: string): ServiceArea | null {
  const haystack = rawText.toLowerCase();
  if (mumbaiTokens.some((token) => haystack.includes(token))) {
    return "Mumbai Metro";
  }
  if (goaTokens.some((token) => haystack.includes(token))) {
    return "Goa";
  }
  return null;
}

function describeServiceability(rawLabel: string, serviceArea: ServiceArea | null) {
  if (!serviceArea) {
    return {
      status: "unserviceable" as const,
      label: rawLabel,
      details: SERVICE_UNAVAILABLE_MESSAGE
    };
  }

  return {
    status: "serviceable" as const,
    label: rawLabel,
    details: `Service available in ${serviceArea}. Continue with the rest of your booking details.`
  };
}

function cityFromServiceArea(serviceArea: ServiceArea): "Mumbai" | "Goa" {
  return serviceArea === "Mumbai Metro" ? "Mumbai" : "Goa";
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 120000
    });
  });
}

async function reverseGeocode(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude.toString(),
    lon: longitude.toString(),
    zoom: "16",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("We could not confirm your location automatically.");
  }

  const payload = (await response.json()) as ReverseGeocodeResponse;
  const addressValues = Object.values(payload.address ?? {}).filter(Boolean) as string[];
  const searchableText = [payload.display_name ?? "", ...addressValues].join(" ");
  const serviceArea = detectServiceArea(searchableText);
  const label = [
    payload.address?.suburb,
    payload.address?.neighbourhood,
    payload.address?.city_district,
    payload.address?.city,
    payload.address?.town,
    payload.address?.state
  ]
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return {
    serviceArea,
    label: label || payload.display_name || "Detected location",
    details: payload.display_name || label || "Detected location"
  };
}

export default function CheckoutExperience({
  entry,
  includedFeatures,
  excludedFeatures,
  addOnFeatures
}: CheckoutExperienceProps) {
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("online");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [locationResolution, setLocationResolution] = useState<LocationResolution>({ status: "idle" });
  const [amcSelected, setAmcSelected] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState | null>(null);
  const [isBottomCtaVisible, setIsBottomCtaVisible] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);
  const locationRef = useRef<HTMLElement | null>(null);
  const finalCtaRef = useRef<HTMLDivElement | null>(null);
  const checkoutLeadIdRef = useRef<string | null>(null);
  const checkoutStartTrackedRef = useRef(false);
  const checkoutLeadSuccessTrackedRef = useRef(false);

  const basePrice = useMemo(() => parsePriceAmount(entry.plan.price), [entry.plan.price]);
  const amcFeature = useMemo(
    () => addOnFeatures.find((feature) => feature.id === "amc-recheck" || feature.label.toLowerCase().includes("amc")) ?? null,
    [addOnFeatures]
  );
  const hasAmcOption = Boolean(amcFeature);
  const amcAmount = useMemo(() => (basePrice === null ? null : Math.round(basePrice * AMC_RATE)), [basePrice]);
  const amcBenefits = amcFeature?.benefits?.length ? amcFeature.benefits : defaultAmcBenefits;
  const installationFee = paymentChoice === "installation" ? PAY_ON_INSTALLATION_SURCHARGE : 0;
  const totalPayable = basePrice === null ? null : basePrice + (amcSelected && hasAmcOption ? amcAmount ?? 0 : 0) + installationFee;
  const leadTotalPayable = totalPayable ?? 0;
  const serviceableLocation = locationResolution.status === "serviceable" ? locationResolution : null;
  const stickySummary = `${paymentChoice === "online" ? "Online payment" : `Pay on installation + ${formatCurrency(PAY_ON_INSTALLATION_SURCHARGE)}`}${
    amcSelected && hasAmcOption ? ` • AMC ${formatAmount(amcAmount)}` : " • No AMC"
  }`;

  useEffect(() => {
    if (checkoutStartTrackedRef.current) {
      return;
    }

    checkoutStartTrackedRef.current = true;
    trackAnalyticsEvent("checkout_start", {
      package: entry.plan.id,
      cta_location: "checkout-page",
      section: "checkout"
    });
  }, [entry.plan.id]);

  useEffect(() => {
    if (!finalCtaRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBottomCtaVisible(entry.isIntersecting);
      },
      {
        threshold: 0.25
      }
    );

    observer.observe(finalCtaRef.current);
    return () => observer.disconnect();
  }, []);

  async function handleUseCurrentLocation() {
    setReviewState(null);
    setFormError(null);
    setLocationResolution({ status: "loading" });

    try {
      const position = await getCurrentPosition();
      const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      const serviceability = describeServiceability(result.label, result.serviceArea);

      if (serviceability.status === "serviceable") {
        setLocationResolution({
          status: "serviceable",
          source: "geolocation",
          label: result.label,
          details: result.details,
          serviceArea: result.serviceArea as ServiceArea,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        return;
      }

      setShowManualLocation(true);
      setLocationResolution({
        status: "unserviceable",
        source: "geolocation",
        label: result.label,
        details: SERVICE_UNAVAILABLE_MESSAGE
      });
    } catch {
      setShowManualLocation(true);
      setLocationResolution({
        status: "error",
        message: "We could not confirm your live location. Enter your area manually to continue."
      });
    }
  }

  function handleManualLocationCheck() {
    setReviewState(null);
    setFormError(null);

    const trimmedLocation = manualLocation.trim();
    if (!trimmedLocation) {
      setLocationResolution({
        status: "error",
        message: "Enter your area, locality, or city to check serviceability."
      });
      return;
    }

    const serviceArea = detectServiceArea(trimmedLocation);
    const serviceability = describeServiceability(trimmedLocation, serviceArea);

    if (serviceability.status === "serviceable") {
      setLocationResolution({
        status: "serviceable",
        source: "manual",
        label: trimmedLocation,
        details: `Manual area check matched ${serviceArea}.`,
        serviceArea: serviceArea as ServiceArea
      });
      return;
    }

    setLocationResolution({
      status: "unserviceable",
      source: "manual",
      label: trimmedLocation,
      details: SERVICE_UNAVAILABLE_MESSAGE
    });
  }

  function handleStickyPrimaryAction() {
    if (!serviceableLocation) {
      locationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    finalCtaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const detailedSummaryCard = (
    <aside className={styles.summaryCard} aria-label="Selected package summary">
      <div className={styles.summaryVisualWrap}>
        {entry.plan.visual?.src ? (
          <CmsImage
            visual={entry.plan.visual}
            fallbackAlt={entry.plan.name}
            width={1200}
            height={960}
            sizes="(max-width: 900px) calc(100vw - 2rem), 420px"
            className={styles.summaryVisual}
          />
        ) : (
          <div className={styles.summaryVisualPlaceholder} aria-hidden="true">
            {entry.plan.name}
          </div>
        )}
        {entry.plan.badge ? <span className={styles.summaryBadge}>{entry.plan.badge}</span> : null}
      </div>

      <div className={styles.summaryBody}>
        <div className={styles.summaryHeader}>
          <p className={styles.summaryKicker}>Package breakdown</p>
          <h2 className={styles.summaryTitle}>{entry.plan.titleDescriptor || entry.plan.name}</h2>
          <p className={styles.summaryCopy}>{entry.plan.bestFor || entry.sectionSubtitle}</p>
        </div>

        <div className={styles.summaryOverview}>
          <div className={styles.summaryPriceBlock}>
            <p className={styles.priceValue}>{formatAmount(basePrice)}</p>
            <p className={styles.reviewCopy}>Base package price</p>
          </div>
          <div className={styles.summaryOverviewMeta}>
            <p className={styles.savingsBadge}>{entry.plan.savings}</p>
            <p className={styles.reviewCopy}>Final total updates live as AMC and payment options change.</p>
          </div>
        </div>

        <div className={styles.summaryTotals}>
          <div className={styles.summaryTotalRow}>
            <span>Package total</span>
            <strong>{formatAmount(basePrice)}</strong>
          </div>
          {hasAmcOption ? (
            <div className={styles.summaryTotalRow}>
              <span>AMC add-on</span>
              <strong>{amcSelected ? formatAmount(amcAmount) : "Not added"}</strong>
            </div>
          ) : null}
          <div className={styles.summaryTotalRow}>
            <span>Pay on installation fee</span>
            <strong>{installationFee > 0 ? formatCurrency(installationFee) : formatCurrency(0)}</strong>
          </div>
          <div className={`${styles.summaryTotalRow} ${styles.summaryTotalFinal}`}>
            <span>Final payable</span>
            <strong>{formatAmount(totalPayable)}</strong>
          </div>
        </div>

        {entry.plan.visualHighlights && entry.plan.visualHighlights.length > 0 ? (
          <div className={styles.highlightRow}>
            {entry.plan.visualHighlights.map((highlight) => (
              <span key={highlight} className={styles.highlightChip}>
                {highlight}
              </span>
            ))}
          </div>
        ) : null}

        <div className={styles.summarySections}>
          <section className={styles.summarySection}>
            <p className={styles.summarySectionTitle}>Included</p>
            <ul className={styles.featureList}>
              {includedFeatures.map((feature) => (
                <li key={feature.id} className={`${styles.featureItem} ${styles.featureItemIncluded}`}>
                  <span className={styles.featureIcon} aria-hidden="true">
                    +
                  </span>
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.summarySection}>
            <p className={styles.summarySectionTitle}>Not included</p>
            {excludedFeatures.length > 0 ? (
              <ul className={styles.featureList}>
                {excludedFeatures.map((feature) => (
                  <li key={feature.id} className={`${styles.featureItem} ${styles.featureItemExcluded}`}>
                    <span className={styles.featureIcon} aria-hidden="true">
                      -
                    </span>
                    <span>{feature.label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.featureEmpty}>This package includes all listed features.</p>
            )}
          </section>
        </div>
      </div>
    </aside>
  );

  return (
    <div className={styles.checkoutShell}>
      {!isBottomCtaVisible ? (
        <div className={styles.stickyBookingBar}>
          <div className={styles.stickyBookingMeta}>
            <p className={styles.stickyBookingKicker}>Booking summary</p>
            <div className={styles.stickyBookingRow}>
              <strong>{entry.plan.name}</strong>
              <span>{formatAmount(totalPayable)}</span>
            </div>
            <p className={styles.stickyBookingCopy}>{stickySummary}</p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={handleStickyPrimaryAction}>
            {serviceableLocation ? "Continue to final review" : "Start with location"}
          </button>
        </div>
      ) : null}

      <section className={styles.flowColumn} aria-label="Booking and payment details">
        <section id="checkout-location" ref={locationRef} className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <p className={styles.formKicker}>Step 1</p>
            <h2 className={styles.moduleTitle}>Pin your service location</h2>
            <p className={styles.formLead}>Allow location access for the fastest check, or enter your area manually if you prefer.</p>
          </div>

          <p className={styles.locationPrivacyNotice}>
            If you use current location, your browser shares precise coordinates with Mason Company. We send them to OpenStreetMap&apos;s Nominatim service to identify your area and may include the resolved location and coordinates in booking metadata sent to our CRM. You can enter your area manually instead.
          </p>

          <div className={styles.locationActions}>
            <button type="button" className={styles.primaryButton} onClick={handleUseCurrentLocation} disabled={locationResolution.status === "loading"}>
              {locationResolution.status === "loading" ? "Checking location..." : "Use current location"}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                setShowManualLocation(true);
                setReviewState(null);
              }}
            >
              Enter area manually
            </button>
          </div>

          {locationResolution.status === "serviceable" ? (
            <div className={`${styles.statusCard} ${styles.statusCardSuccess}`}>
              <div>
                <p className={styles.locationStatusTitle}>Service available</p>
                <p className={styles.locationStatusCopy}>{locationResolution.label}</p>
                <p className={styles.locationMeta}>{locationResolution.details}</p>
              </div>
              <span className={styles.serviceablePill}>{locationResolution.serviceArea}</span>
            </div>
          ) : null}

          {locationResolution.status === "unserviceable" ? (
            <div className={`${styles.statusCard} ${styles.statusCardWarning}`}>
              <div>
                <p className={styles.locationStatusTitle}>Outside current service area</p>
                <p className={styles.locationStatusCopy}>{locationResolution.label}</p>
                <p className={styles.locationMeta}>{locationResolution.details}</p>
              </div>
            </div>
          ) : null}

          {locationResolution.status === "error" ? (
            <div className={`${styles.statusCard} ${styles.statusCardError}`}>
              <div>
                <p className={styles.locationStatusTitle}>Location check incomplete</p>
                <p className={styles.locationMeta}>{locationResolution.message}</p>
              </div>
            </div>
          ) : null}

          {showManualLocation ? (
            <div className={styles.inlinePanel}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Area, locality, or city</span>
                <input
                  className={styles.input}
                  type="text"
                  value={manualLocation}
                  onChange={(event) => {
                    setManualLocation(event.target.value);
                    setReviewState(null);
                  }}
                  placeholder="For example: Andheri West, Mumbai or Panaji, Goa"
                />
              </label>
              <div className={styles.manualLocationActions}>
                <button type="button" className={styles.secondaryButton} onClick={handleManualLocationCheck}>
                  Check serviceability
                </button>
                <p className={styles.fieldHint}>We currently serve Mumbai metro and Goa.</p>
              </div>
            </div>
          ) : null}
        </section>

        <form
          ref={formRef}
          className={styles.formStack}
          onChange={() => {
            if (reviewState) {
              setReviewState(null);
            }
          }}
          onSubmit={async (event) => {
            event.preventDefault();
            setFormError(null);

            if (!serviceableLocation) {
              setFormError("Confirm a serviceable location before continuing.");
              return;
            }

            if (phoneDigits.length !== 10) {
              setPhoneError("Enter a 10-digit phone number.");
              return;
            }

            const formData = new FormData(event.currentTarget);
            const reviewPayload = {
              name: String(formData.get("name") || ""),
              phone: `+91 ${phoneDigits}`,
              locationLabel: serviceableLocation.label,
              serviceArea: serviceableLocation.serviceArea,
              date: String(formData.get("date") || ""),
              slot: String(formData.get("slot") || ""),
              paymentChoice,
              amcSelected: hasAmcOption && amcSelected,
              amcAmount: hasAmcOption && amcSelected ? amcAmount : 0,
              installationFee,
              totalPayable
            } satisfies ReviewState;

            setPhoneError(null);
            if (!checkoutLeadIdRef.current) {
              setIsSubmittingReview(true);

              try {
                const response = await fetch("/api/leads/checkout", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                  },
                  body: JSON.stringify({
                    customerName: reviewPayload.name,
                    phone: phoneDigits,
                    city: cityFromServiceArea(serviceableLocation.serviceArea),
                    locationText: `${serviceableLocation.label}${String(formData.get("addressLine1") || "").trim() ? ` • ${String(formData.get("addressLine1") || "").trim()}` : ""}`,
                    packageCode: entry.plan.id,
                    preferredDate: reviewPayload.date,
                    preferredSlot: reviewPayload.slot,
                    paymentChoice: reviewPayload.paymentChoice,
                    amcSelected: reviewPayload.amcSelected,
                    totalPayable: leadTotalPayable,
                    serviceAreaLabel: serviceableLocation.serviceArea,
                    notes: String(formData.get("address") || "") || undefined,
                    metadata: {
                      source: "website-checkout",
                      intentCategory: "booking",
                      attribution: getLeadAttributionContext({
                        entryPoint: "checkout-review",
                        pageSection: "checkout",
                        ctaId: "prepare-booking-request",
                        packageCode: entry.plan.id,
                        packageName: entry.plan.name
                      }),
                      quiz: getQuizContext(),
                      package: {
                        code: entry.plan.id,
                        displayName: entry.plan.name,
                        basePrice
                      },
                      visitPreference: {
                        preferredDate: reviewPayload.date,
                        preferredSlot: reviewPayload.slot
                      },
                      payment: {
                        choice: reviewPayload.paymentChoice,
                        installationSurcharge: reviewPayload.installationFee,
                        amcSelected: reviewPayload.amcSelected,
                        amcAmount: reviewPayload.amcAmount,
                        totalPayable: reviewPayload.totalPayable,
                        priceStatus: reviewPayload.totalPayable === null ? "to-be-confirmed" : "priced"
                      },
                      serviceability: {
                        serviceAreaLabel: serviceableLocation.serviceArea,
                        locationSource: serviceableLocation.source,
                        resolvedLabel: serviceableLocation.label,
                        latitude: serviceableLocation.latitude,
                        longitude: serviceableLocation.longitude
                      }
                    }
                  })
                });

                if (!response.ok) {
                  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
                  throw new Error(payload?.error || "We could not prepare your booking request.");
                }

                const payload = (await response.json()) as { data?: { id?: string } };
                if (!checkoutLeadSuccessTrackedRef.current) {
                  checkoutLeadSuccessTrackedRef.current = true;
                  trackAnalyticsEvent("checkout_lead_submit_success", {
                    package: entry.plan.id,
                    cta_location: "checkout-review",
                    section: "checkout"
                  });
                }
                checkoutLeadIdRef.current = payload.data?.id || "captured";
              } catch (error) {
                setFormError(error instanceof Error ? error.message : "We could not prepare your booking request.");
                setIsSubmittingReview(false);
                return;
              }

              setIsSubmittingReview(false);
            }

            setReviewState(reviewPayload);
          }}
        >
          {serviceableLocation ? (
            <>
              <section id="checkout-details" className={styles.moduleCard}>
                <div className={styles.moduleHeader}>
                  <p className={styles.formKicker}>Step 2</p>
                  <h2 className={styles.moduleTitle}>Enter visit and contact details</h2>
                  <p className={styles.formLead}>Your verified location stays pinned to this booking. Add the rest of the visit details below.</p>
                </div>

                <div className={styles.verifiedLocationCard}>
                  <div>
                    <p className={styles.reviewPanelKicker}>Verified location</p>
                    <p className={styles.locationStatusCopy}>{serviceableLocation.label}</p>
                    <p className={styles.locationMeta}>{serviceableLocation.details}</p>
                  </div>
                  <span className={styles.serviceablePill}>{serviceableLocation.serviceArea}</span>
                </div>

                <div className={styles.detailsGrid}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Full name</span>
                    <input className={styles.input} type="text" name="name" placeholder="Family contact name" required />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Phone number</span>
                    <div className={styles.phoneFieldShell}>
                      <span className={styles.phonePrefix}>+91</span>
                      <input
                        className={`${styles.input} ${styles.phoneInput}`}
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        name="phone"
                        placeholder="10-digit mobile number"
                        value={phoneDigits}
                        onChange={(event) => {
                          setPhoneDigits(sanitizePhone(event.target.value));
                          setPhoneError(null);
                          setReviewState(null);
                        }}
                        required
                      />
                    </div>
                    {phoneError ? <p className={styles.inlineError}>{phoneError}</p> : <p className={styles.fieldHint}>Enter only the 10-digit mobile number.</p>}
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Bathroom count</span>
                    <select className={styles.input} name="bathrooms" defaultValue="1">
                      <option value="1">1 bathroom</option>
                      <option value="2">2 bathrooms</option>
                      <option value="3+">3+ bathrooms</option>
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Preferred visit date</span>
                    <input className={styles.input} type="date" name="date" required />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Preferred time slot</span>
                    <select className={styles.input} name="slot" defaultValue={slotOptions[0]} required>
                      {slotOptions.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Building / flat / floor</span>
                    <input className={styles.input} type="text" name="addressLine1" placeholder="Building name, flat number, floor" required />
                  </label>

                  <label className={`${styles.field} ${styles.fieldSpanFull}`}>
                    <span className={styles.fieldLabel}>Address and access notes</span>
                    <textarea
                      className={`${styles.input} ${styles.textarea}`}
                      name="address"
                      placeholder="Parking, gate access, lift details, landmark, or movement notes"
                    />
                  </label>
                </div>
              </section>

              {hasAmcOption ? (
                <section className={styles.moduleCard}>
                  <div className={styles.moduleHeader}>
                    <p className={styles.formKicker}>Step 3</p>
                    <h2 className={styles.moduleTitle}>Choose AMC follow-up support</h2>
                    <p className={styles.formLead}>
                      {amcFeature?.description || "Add a post-installation care plan to keep the installed safety setup performing well over time."}
                    </p>
                  </div>

                  <label className={`${styles.selectionCard} ${styles.amcToggle}${amcSelected ? ` ${styles.selectionCardSelected}` : ""}`}>
                    <input
                      className={styles.paymentInput}
                      type="checkbox"
                      checked={amcSelected}
                      onChange={() => {
                        setAmcSelected((current) => !current);
                        setReviewState(null);
                      }}
                    />
                    <div className={styles.selectionCopy}>
                      <div className={styles.selectionHeader}>
                        <span className={styles.selectionTitle}>Add AMC for {formatAmount(amcAmount)}</span>
                        <span className={styles.selectionPill}>{amcSelected ? "Added" : "Optional"}</span>
                      </div>
                      <span className={styles.selectionMeta}>15% of the package price</span>
                    </div>
                  </label>

                  <ul className={styles.amcBenefits}>
                    {amcBenefits.map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className={styles.moduleCard}>
                <div className={styles.moduleHeader}>
                  <p className={styles.formKicker}>Step 4</p>
                  <h2 className={styles.moduleTitle}>Choose payment method</h2>
                  <p className={styles.formLead}>Online payment keeps pricing clean. Pay on installation remains available with a ₹500 assisted collection fee.</p>
                </div>

                <div className={styles.selectionGrid}>
                  <label className={`${styles.selectionCard} ${paymentChoice === "online" ? ` ${styles.selectionCardSelected}` : ""}`}>
                    <input
                      className={styles.paymentInput}
                      type="radio"
                      name="paymentChoice"
                      value="online"
                      checked={paymentChoice === "online"}
                      onChange={() => {
                        setPaymentChoice("online");
                        setReviewState(null);
                      }}
                    />
                    <div className={styles.selectionCopy}>
                      <div className={styles.selectionHeader}>
                        <span className={styles.selectionTitle}>Online payment</span>
                        <span className={styles.selectionPill}>Recommended</span>
                      </div>
                      <span className={styles.selectionMeta}>Card, UPI, or bank transfer in the next step.</span>
                      <strong className={styles.selectionImpact}>+ {formatCurrency(0)}</strong>
                    </div>
                  </label>

                  <label className={`${styles.selectionCard} ${paymentChoice === "installation" ? ` ${styles.selectionCardSelected}` : ""}`}>
                    <input
                      className={styles.paymentInput}
                      type="radio"
                      name="paymentChoice"
                      value="installation"
                      checked={paymentChoice === "installation"}
                      onChange={() => {
                        setPaymentChoice("installation");
                        setReviewState(null);
                      }}
                    />
                    <div className={styles.selectionCopy}>
                      <div className={styles.selectionHeader}>
                        <span className={styles.selectionTitle}>Pay on installation</span>
                        <span className={styles.selectionPill}>Additional service</span>
                      </div>
                      <span className={styles.selectionMeta}>Complete payment at the visit using UPI, POS, or cash.</span>
                      <strong className={styles.selectionImpact}>+ {formatCurrency(PAY_ON_INSTALLATION_SURCHARGE)}</strong>
                    </div>
                  </label>
                </div>
              </section>

              <section ref={finalCtaRef} className={`${styles.moduleCard} ${styles.finalActionSection}`}>
                <div className={styles.moduleHeader}>
                  <p className={styles.formKicker}>Step 5</p>
                  <h2 className={styles.moduleTitle}>Review and confirm booking</h2>
                  <p className={styles.formLead}>Your final payable amount reflects the package, AMC selection, and payment method chosen above.</p>
                </div>

                <div className={styles.finalActionGrid}>
                  <div className={styles.finalActionSummary}>
                    <div className={styles.summaryTotalRow}>
                      <span>Package total</span>
                      <strong>{formatAmount(basePrice)}</strong>
                    </div>
                    {hasAmcOption ? (
                      <div className={styles.summaryTotalRow}>
                        <span>AMC add-on</span>
                        <strong>{amcSelected ? formatAmount(amcAmount) : "Not added"}</strong>
                      </div>
                    ) : null}
                    <div className={styles.summaryTotalRow}>
                      <span>Pay on installation fee</span>
                      <strong>{installationFee > 0 ? formatCurrency(installationFee) : formatCurrency(0)}</strong>
                    </div>
                    <div className={`${styles.summaryTotalRow} ${styles.summaryTotalFinal}`}>
                      <span>Final payable</span>
                      <strong>{formatAmount(totalPayable)}</strong>
                    </div>
                  </div>

                  <div className={styles.finalActionCta}>
                    <p className={styles.reviewTitle}>{paymentChoice === "online" ? "Online payment selected" : "Pay on installation selected"}</p>
                    <p className={styles.reviewCopy}>{stickySummary}</p>
                    <button type="submit" className={styles.primaryButton} disabled={isSubmittingReview}>
                      {isSubmittingReview ? "Preparing booking..." : "Review booking details"}
                    </button>
                    <LeadPrivacyNotice className={styles.privacyNotice} />
                  </div>
                </div>
              </section>
            </>
          ) : null}

          {formError ? <p className={styles.inlineError}>{formError}</p> : null}
        </form>

        {reviewState ? (
          <section className={`${styles.moduleCard} ${styles.reviewPanel}`} aria-live="polite">
            <p className={styles.reviewPanelKicker}>Booking request received</p>
            <h2 className={styles.reviewPanelTitle}>Your {entry.plan.name} booking request has been sent to Mason Company.</h2>
            <div className={styles.reviewStats}>
              <div className={styles.reviewStat}>
                <span className={styles.reviewStatLabel}>Package</span>
                <strong>{entry.plan.name}</strong>
              </div>
              <div className={styles.reviewStat}>
                <span className={styles.reviewStatLabel}>Location</span>
                <strong>{reviewState.serviceArea}</strong>
              </div>
              <div className={styles.reviewStat}>
                <span className={styles.reviewStatLabel}>Phone</span>
                <strong>{reviewState.phone}</strong>
              </div>
              <div className={styles.reviewStat}>
                <span className={styles.reviewStatLabel}>Visit</span>
                <strong>{formatDate(reviewState.date)}</strong>
              </div>
              <div className={styles.reviewStat}>
                <span className={styles.reviewStatLabel}>Payment</span>
                <strong>{reviewState.paymentChoice === "online" ? "Online" : `On installation (${formatCurrency(reviewState.installationFee)})`}</strong>
              </div>
              <div className={styles.reviewStat}>
                <span className={styles.reviewStatLabel}>AMC</span>
                <strong>{reviewState.amcSelected ? formatAmount(reviewState.amcAmount) : "Not added"}</strong>
              </div>
              <div className={styles.reviewStat}>
                <span className={styles.reviewStatLabel}>Final payable</span>
                <strong>{formatAmount(reviewState.totalPayable)}</strong>
              </div>
            </div>
            <p className={styles.reviewPanelCopy}>
              Our team will call to confirm the visit slot, service address, and selected payment route before the booking is finalized. No online
              payment is collected on this screen.
            </p>
            <p className={styles.reviewPanelCopy}>
              Keep your phone reachable for the next step. Your preferred slot is {reviewState.slot}, and the request is marked serviceable for{" "}
              {reviewState.serviceArea}.
            </p>
          </section>
        ) : null}

        {detailedSummaryCard}
      </section>
    </div>
  );
}
