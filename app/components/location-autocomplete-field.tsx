"use client";

import type { CSSProperties } from "react";
import { useLocationAutocomplete } from "../../lib/use-location-autocomplete";
import type { LocationMeta } from "../../lib/location";
import styles from "./guidance-form.module.css";

interface Props {
  disabled?: boolean;
  formSource?: string;
  onMeta?: (meta: LocationMeta) => void;
}

const buttonStyle: CSSProperties = {
  marginTop: 8,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  minHeight: 44,
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--primary)",
  background: "var(--surface-container-lowest)",
  border: "1px solid var(--line-warm)",
  borderRadius: 8,
  cursor: "pointer"
};

const hintStyle: CSSProperties = {
  display: "block",
  marginTop: 6,
  fontSize: 13,
  color: "var(--muted)"
};

export default function LocationAutocompleteField({ disabled, formSource = "assessment_form", onMeta }: Props) {
  const { inputRef, value, geoState, hint, manualOnly, handleChange, useMyLocation } = useLocationAutocomplete({
    disabled,
    formSource,
    onMeta
  });

  return (
    <label className={styles.fullWidth}>
      <span>Location</span>
      <input
        key={manualOnly ? "manual" : "places"}
        ref={inputRef}
        type="text"
        name="locationText"
        inputMode="text"
        autoComplete="off"
        placeholder="Start typing your full address"
        disabled={disabled}
        value={value}
        onChange={handleChange}
      />
      <button type="button" style={buttonStyle} onClick={useMyLocation} disabled={disabled || geoState === "locating"}>
        {geoState === "locating" ? "Locating…" : "📍 Use my location"}
      </button>
      {hint ? <span style={hintStyle}>{hint}</span> : null}
    </label>
  );
}
