"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  cityFromServiceArea,
  detectServiceArea,
  getCurrentPosition,
  getGoogleMapsApiKey,
  loadGooglePlaces,
  reverseGeocode,
  type LocationMeta
} from "../../lib/location";
import styles from "./guidance-form.module.css";

type GeoState = "idle" | "locating" | "located" | "denied" | "error";

interface Props {
  disabled?: boolean;
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

// The Google Places dropdown is appended to <body>; ensure it floats above the form.
function ensurePacStyle() {
  if (typeof document === "undefined" || document.getElementById("aegis-pac-style")) {
    return;
  }
  const style = document.createElement("style");
  style.id = "aegis-pac-style";
  style.textContent = ".pac-container{z-index:100000 !important;border-radius:10px;}";
  document.head.appendChild(style);
}

export default function LocationAutocompleteField({ disabled, onMeta }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEnrichedRef = useRef<string>("");
  const [value, setValue] = useState("");
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [hint, setHint] = useState<string | null>(null);

  function emitManual(text: string) {
    const area = detectServiceArea(text);
    onMeta?.({
      source: "manual",
      formattedAddress: text,
      serviceArea: area,
      serviceCity: cityFromServiceArea(area),
      serviceable: area !== null
    });
  }

  // Progressive enhancement: attach Google Places autocomplete when a key is set.
  useEffect(() => {
    if (!getGoogleMapsApiKey()) {
      return; // no key → manual entry + geolocation only
    }
    let cancelled = false;
    let autocomplete: any;
    let listener: any;
    ensurePacStyle();

    loadGooglePlaces().then((google) => {
      if (cancelled || !google || !inputRef.current) {
        return;
      }
      try {
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "place_id", "address_components", "name"],
          componentRestrictions: { country: "in" }
        });
        listener = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const formatted: string = place.formatted_address || place.name || inputRef.current?.value || "";
          const components: any[] = place.address_components || [];
          const localityComponent =
            components.find((c) => c.types?.includes("locality")) ||
            components.find((c) => c.types?.includes("administrative_area_level_2"));
          const detectedCity: string = localityComponent?.long_name || "";
          const area = detectServiceArea([formatted, detectedCity, ...components.map((c) => c.long_name)].join(" "));

          setValue(formatted);
          lastEnrichedRef.current = formatted;
          onMeta?.({
            source: "google_places",
            formattedAddress: formatted,
            placeId: place.place_id,
            lat: place.geometry?.location?.lat?.(),
            lng: place.geometry?.location?.lng?.(),
            detectedCity,
            serviceArea: area,
            serviceCity: cityFromServiceArea(area),
            serviceable: area !== null
          });
        });
      } catch {
        // Autocomplete unavailable (e.g. legacy API disabled) → manual fallback.
      }
    });

    return () => {
      cancelled = true;
      try {
        listener?.remove?.();
        window.google?.maps?.event?.clearInstanceListeners?.(autocomplete);
      } catch {
        /* noop */
      }
    };
  }, [onMeta]);

  async function useMyLocation() {
    if (disabled || geoState === "locating") {
      return;
    }
    setGeoState("locating");
    setHint("Detecting your location…");
    try {
      const position = await getCurrentPosition();
      const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      setValue(result.label);
      lastEnrichedRef.current = result.label;
      setGeoState("located");
      setHint(
        result.serviceArea
          ? `Detected: ${result.label}`
          : `Detected: ${result.label} — we'll confirm serviceability when we call.`
      );
      onMeta?.({
        source: "geolocation",
        formattedAddress: result.label,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        detectedCity: result.detectedCity,
        serviceArea: result.serviceArea,
        serviceCity: cityFromServiceArea(result.serviceArea),
        serviceable: result.serviceArea !== null
      });
    } catch (error) {
      const denied = typeof error === "object" && error !== null && (error as { code?: number }).code === 1;
      setGeoState(denied ? "denied" : "error");
      setHint(
        denied
          ? "Location access is off — just type your area below."
          : "Couldn't detect your location — please type your area below."
      );
    }
  }

  return (
    <label className={styles.fullWidth}>
      <span>Location / Area</span>
      <input
        ref={inputRef}
        type="text"
        name="locationText"
        inputMode="text"
        autoComplete="off"
        placeholder="Andheri West, Panaji, or your area"
        required
        disabled={disabled}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (next !== lastEnrichedRef.current) {
            emitManual(next);
          }
        }}
      />
      <button type="button" style={buttonStyle} onClick={useMyLocation} disabled={disabled || geoState === "locating"}>
        {geoState === "locating" ? "Locating…" : "📍 Use my location"}
      </button>
      {hint ? <span style={hintStyle}>{hint}</span> : null}
    </label>
  );
}
