"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  getCurrentPosition,
  getGoogleMapsApiKey,
  isSelectedLocationStale,
  loadGooglePlaces,
  manualLocationMeta,
  resolveSelectedGooglePlace,
  reverseGeocode,
  type LocationMeta
} from "../../lib/location";
import { trackAnalyticsEvent } from "../../lib/analytics";
import styles from "./guidance-form.module.css";

type GeoState = "idle" | "locating" | "located" | "denied" | "error";

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

export default function LocationAutocompleteField({ disabled, formSource = "assessment_form", onMeta }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEnrichedRef = useRef<string>("");
  const onMetaRef = useRef(onMeta);
  const [value, setValue] = useState("");
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    onMetaRef.current = onMeta;
  }, [onMeta]);

  function emitManual(text: string) {
    onMetaRef.current?.(manualLocationMeta(text));
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
          fields: ["formatted_address", "geometry", "place_id", "address_components", "name"]
        });
        listener = autocomplete.addListener("place_changed", async () => {
          const place = autocomplete.getPlace();
          const resolved = await resolveSelectedGooglePlace(place);
          const formatted = resolved.formattedAddress || inputRef.current?.value || "";
          setValue(formatted);
          lastEnrichedRef.current = formatted;
          setHint("Address selected. You can continue with the form.");
          onMetaRef.current?.(resolved);
          trackAnalyticsEvent("location_picker_success", {
            market: resolved.serviceability.locationMarket,
            form_source: formSource
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
  }, [formSource]);

  async function useMyLocation() {
    if (disabled || geoState === "locating") {
      return;
    }
    setGeoState("locating");
    setHint("Detecting your location…");
    try {
      const position = await getCurrentPosition();
      const result = await reverseGeocode(position.coords.latitude, position.coords.longitude);
      const label = result.formattedAddress || "Detected location";
      setValue(label);
      lastEnrichedRef.current = label;
      setGeoState("located");
      setHint("Location added. You can continue with the form.");
      onMetaRef.current?.(result);
      trackAnalyticsEvent("location_picker_success", {
        market: result.serviceability.locationMarket,
        form_source: formSource
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
        placeholder="Start typing your full address"
        required
        disabled={disabled}
        value={value}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (isSelectedLocationStale(lastEnrichedRef.current, next) || !lastEnrichedRef.current) {
            lastEnrichedRef.current = "";
            setHint(null);
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
