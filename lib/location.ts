"use client";

import {
  classifyGoogleAddress,
  unknownServiceability,
  type GoogleAddressComponent,
  type ServiceabilityMetadata
} from "./serviceability";

export interface LocationMeta {
  source: "google_places" | "geolocation" | "manual";
  formattedAddress?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  addressComponents?: GoogleAddressComponent[];
  serviceability: ServiceabilityMetadata;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
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

declare global {
  interface Window {
    google?: any;
    __aegisGooglePlaces__?: Promise<any | null>;
    __aegisGooglePlacesReady__?: () => void;
    __aegisGooglePlacesFailed__?: boolean;
    __aegisGoogleAuthHandler__?: boolean;
    gm_authFailure?: () => void;
  }
}

export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
}

export function loadGooglePlaces(): Promise<any | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.__aegisGooglePlacesFailed__) return Promise.resolve(null);
  if (!window.__aegisGoogleAuthHandler__) {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      window.__aegisGooglePlacesFailed__ = true;
      window.dispatchEvent(new Event("mason:places-unavailable"));
      try { previous?.(); } catch { /* Other integrations must not block fallback. */ }
    };
    window.__aegisGoogleAuthHandler__ = true;
  }
  const key = getGoogleMapsApiKey();
  if (!key) return Promise.resolve(null);
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (window.__aegisGooglePlaces__) return window.__aegisGooglePlaces__;

  window.__aegisGooglePlaces__ = new Promise<any | null>((resolve) => {
    let settled = false;
    const finish = (value: any | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      if (!value) {
        window.__aegisGooglePlacesFailed__ = true;
        window.dispatchEvent(new Event("mason:places-unavailable"));
      }
      resolve(value);
    };
    const resolveReady = () => {
      if (window.google?.maps?.places) {
        finish(window.google);
      }
    };
    const timeout = window.setTimeout(() => finish(null), 10000);
    const existing = document.getElementById("aegis-google-maps") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", resolveReady, { once: true });
      existing.addEventListener("error", () => finish(null), { once: true });
      return;
    }
    window.__aegisGooglePlacesReady__ = resolveReady;
    const script = document.createElement("script");
    script.id = "aegis-google-maps";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&loading=async&callback=__aegisGooglePlacesReady__`;
    script.addEventListener("load", resolveReady, { once: true });
    script.addEventListener("error", () => finish(null), { once: true });
    document.head.appendChild(script);
  }).catch(() => null);

  return window.__aegisGooglePlaces__;
}

type GooglePlaceLike = {
  formatted_address?: string;
  name?: string;
  place_id?: string;
  address_components?: GoogleAddressComponent[];
  geometry?: { location?: { lat?: () => number; lng?: () => number } };
};

function hasClassifyingComponents(components: GoogleAddressComponent[]) {
  return components.some((item) => item.types?.includes("country")) &&
    components.some((item) => item.types?.includes("administrative_area_level_1"));
}

async function geocodeRequest(request: Record<string, unknown>): Promise<GooglePlaceLike | null> {
  const google = await loadGooglePlaces();
  if (!google?.maps?.Geocoder) return null;

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(request, (results: GooglePlaceLike[] | null, status: string) => {
      resolve(status === "OK" && results?.[0] ? results[0] : null);
    });
  });
}

export async function resolveSelectedGooglePlace(place: GooglePlaceLike): Promise<LocationMeta> {
  const initialComponents = place.address_components || [];
  const placeId = place.place_id || null;
  let resolved = place;
  let source: "GOOGLE_PLACES" | "GOOGLE_GEOCODING" = "GOOGLE_PLACES";

  if (!hasClassifyingComponents(initialComponents) && placeId) {
    const geocoded = await geocodeRequest({ placeId });
    if (geocoded) {
      resolved = geocoded;
      source = "GOOGLE_GEOCODING";
    }
  }

  const components = resolved.address_components || initialComponents;
  const formattedAddress = resolved.formatted_address || place.formatted_address || place.name || "";
  const latitude = resolved.geometry?.location?.lat?.() ?? place.geometry?.location?.lat?.();
  const longitude = resolved.geometry?.location?.lng?.() ?? place.geometry?.location?.lng?.();
  const serviceability = classifyGoogleAddress(components, {
    source,
    formattedAddress,
    placeId,
    latitude,
    longitude
  });

  return {
    source: "google_places",
    formattedAddress,
    placeId: placeId || undefined,
    lat: latitude,
    lng: longitude,
    addressComponents: components,
    serviceability
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationMeta> {
  const result = await geocodeRequest({ location: { lat: latitude, lng: longitude } });
  if (!result) {
    return {
      source: "geolocation",
      formattedAddress: "Current location",
      lat: latitude,
      lng: longitude,
      serviceability: unknownServiceability({
        formattedAddress: "Current location",
        latitude,
        longitude,
        source: "MANUAL_ENTRY"
      })
    };
  }

  const components = result.address_components || [];
  const formattedAddress = result.formatted_address || "Detected location";
  return {
    source: "geolocation",
    formattedAddress,
    placeId: result.place_id,
    lat: latitude,
    lng: longitude,
    addressComponents: components,
    serviceability: classifyGoogleAddress(components, {
      source: "GOOGLE_GEOCODING",
      formattedAddress,
      placeId: result.place_id,
      latitude,
      longitude
    })
  };
}

export function manualLocationMeta(formattedAddress: string): LocationMeta {
  return {
    source: "manual",
    formattedAddress,
    serviceability: unknownServiceability({ formattedAddress, source: "MANUAL_ENTRY" })
  };
}

export function isSelectedLocationStale(selectedAddress: string, currentValue: string) {
  return Boolean(selectedAddress) && selectedAddress !== currentValue;
}
