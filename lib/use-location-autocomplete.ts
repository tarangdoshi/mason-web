"use client";

import { useEffect, useRef, useState } from "react";
import {
  getCurrentPosition,
  getGoogleMapsApiKey,
  isSelectedLocationStale,
  loadGooglePlaces,
  manualLocationMeta,
  resolveSelectedGooglePlace,
  reverseGeocode,
  type LocationMeta
} from "./location";
import { trackAnalyticsEvent } from "./analytics";

export type GeoState = "idle" | "locating" | "located" | "denied" | "error";

interface UseLocationAutocompleteArgs {
  disabled?: boolean;
  formSource?: string;
  onMeta?: (meta: LocationMeta) => void;
}

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

/**
 * Shared address-capture logic behind the "Location" field: Google Places
 * autocomplete with a manual-entry and geolocation fallback. Two presentational
 * components consume this (the CSS-module styled one on the home page's
 * assessment form, and the Tailwind-styled one on the contact page) so the
 * autocomplete/geolocation wiring — and its failure handling — lives in one
 * place instead of being duplicated per form.
 */
export function useLocationAutocomplete({
  disabled,
  formSource = "assessment_form",
  onMeta
}: UseLocationAutocompleteArgs) {
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEnrichedRef = useRef<string>("");
  const onMetaRef = useRef(onMeta);
  const [value, setValue] = useState("");
  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [hint, setHint] = useState<string | null>(null);
  const [manualOnly, setManualOnly] = useState(false);
  const valueRef = useRef(value);
  const disabledRef = useRef(disabled);
  valueRef.current = value;
  disabledRef.current = disabled;

  useEffect(() => {
    onMetaRef.current = onMeta;
  }, [onMeta]);

  function emitManual(text: string) {
    onMetaRef.current?.(manualLocationMeta(text));
  }

  // Progressive enhancement: attach Google Places autocomplete when a key is set.
  useEffect(() => {
    if (manualOnly) return;
    if (!getGoogleMapsApiKey()) {
      return; // no key → manual entry + geolocation only
    }
    let cancelled = false;
    let autocomplete: any;
    let listener: any;
    let observer: MutationObserver | undefined;
    const fallback = () => {
      if (cancelled) return;
      lastEnrichedRef.current = "";
      onMetaRef.current?.(manualLocationMeta(valueRef.current));
      setHint("You can enter your address manually and continue.");
      // A new DOM input detaches Google's mutations/listeners completely.
      setManualOnly(true);
    };
    window.addEventListener("mason:places-unavailable", fallback);
    ensurePacStyle();

    loadGooglePlaces()
      .then((google) => {
        if (cancelled || !inputRef.current) {
          return;
        }
        if (!google || window.__aegisGooglePlacesFailed__) {
          fallback();
          return;
        }
        try {
          const input = inputRef.current;
          observer = new MutationObserver(() => {
            if (
              !disabledRef.current &&
              (input.disabled || input.readOnly || input.placeholder !== "Start typing your full address")
            )
              fallback();
          });
          observer.observe(input, { attributes: true, attributeFilter: ["disabled", "readonly", "placeholder"] });
          autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ["formatted_address", "geometry", "place_id", "address_components", "name"]
          });
          listener = autocomplete.addListener("place_changed", async () => {
            const place = autocomplete.getPlace();
            const resolved = await resolveSelectedGooglePlace(place);
            if (cancelled || window.__aegisGooglePlacesFailed__) {
              fallback();
              return;
            }
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
          fallback();
        }
      })
      .catch(fallback);

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.removeEventListener("mason:places-unavailable", fallback);
      try {
        listener?.remove?.();
        window.google?.maps?.event?.clearInstanceListeners?.(autocomplete);
      } catch {
        /* noop */
      }
    };
  }, [formSource, manualOnly]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setValue(next);
    if (isSelectedLocationStale(lastEnrichedRef.current, next) || !lastEnrichedRef.current) {
      lastEnrichedRef.current = "";
      setHint(null);
      emitManual(next);
    }
  }

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

  return { inputRef, value, geoState, hint, manualOnly, handleChange, useMyLocation };
}
