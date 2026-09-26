"use client";

import { useLocationAutocomplete } from "../lib/use-location-autocomplete";
import type { LocationMeta } from "../lib/location";

interface Props {
  disabled?: boolean;
  className?: string;
  onMeta?: (meta: LocationMeta) => void;
}

const LABEL = "block text-sm font-semibold text-cream";
const OPTIONAL = "ml-1.5 text-xs font-normal text-sand-400";
const FIELD =
  "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-base text-cream transition-colors duration-150";
const INPUT = `${FIELD} placeholder:text-sand-400 focus:outline-none border-sand-200 focus:border-forest-700`;

/**
 * Contact-page counterpart to `app/components/location-autocomplete-field.tsx`
 * (the home page inspection form's location field) — same Google
 * Places autocomplete + "use my location" behaviour via
 * `useLocationAutocomplete`, styled to match this form's own Tailwind field
 * system instead of the assessment form's CSS module.
 */
export default function LocationField({ disabled, className, onMeta }: Props) {
  const { inputRef, value, geoState, hint, manualOnly, handleChange, useMyLocation } = useLocationAutocomplete({
    disabled,
    formSource: "contact_form",
    onMeta
  });

  return (
    <div className={className}>
      <label htmlFor="contact-location" className={LABEL}>
        Location
        <span className={OPTIONAL}>optional</span>
      </label>
      <input
        key={manualOnly ? "manual" : "places"}
        id="contact-location"
        ref={inputRef}
        name="locationText"
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder="Start typing your full address"
        disabled={disabled}
        value={value}
        onChange={handleChange}
        className={INPUT}
      />
      <button
        type="button"
        onClick={useMyLocation}
        disabled={disabled || geoState === "locating"}
        className="mt-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-sand-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-forest-700 transition-colors duration-150 disabled:opacity-70"
      >
        {geoState === "locating" ? "Locating…" : "📍 Use my location"}
      </button>
      <p className="mt-1.5 min-h-4 text-xs leading-4 text-sand-400">{hint}</p>
    </div>
  );
}
