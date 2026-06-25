"use client";

/**
 * Lead-form location utilities.
 *
 * - City auto-detection uses the browser Geolocation API + OpenStreetMap
 *   (Nominatim) reverse geocoding — NO API key, mirrors the checkout flow.
 * - Google Places autocomplete is an OPTIONAL progressive enhancement, gated on
 *   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. When the key is absent or Google fails to
 *   load, callers fall back to plain manual entry (no regression).
 */

export type ServiceArea = "Mumbai Metro" | "Goa";
export type ServiceCity = "Mumbai" | "Goa";

export interface LocationMeta {
  source: "google_places" | "geolocation" | "manual";
  formattedAddress?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  detectedCity?: string;
  serviceArea?: ServiceArea | null;
  serviceCity?: ServiceCity | null;
  serviceable?: boolean;
}

// Kept in sync with the checkout serviceability tokens.
const MUMBAI_TOKENS = [
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
const GOA_TOKENS = ["goa", "north goa", "south goa", "panaji", "mapusa", "margao", "madgaon", "vasco", "porvorim"];

export function detectServiceArea(text: string): ServiceArea | null {
  const haystack = (text || "").toLowerCase();
  if (MUMBAI_TOKENS.some((token) => haystack.includes(token))) {
    return "Mumbai Metro";
  }
  if (GOA_TOKENS.some((token) => haystack.includes(token))) {
    return "Goa";
  }
  return null;
}

export function cityFromServiceArea(area: ServiceArea | null): ServiceCity | null {
  if (area === "Mumbai Metro") return "Mumbai";
  if (area === "Goa") return "Goa";
  return null;
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

interface NominatimResponse {
  display_name?: string;
  address?: Record<string, string | undefined>;
}

export interface ReverseGeocodeResult {
  label: string;
  detectedCity: string;
  serviceArea: ServiceArea | null;
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude.toString(),
    lon: longitude.toString(),
    zoom: "16",
    addressdetails: "1"
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error("We could not confirm your location automatically.");
  }

  const payload = (await response.json()) as NominatimResponse;
  const address = payload.address ?? {};
  const addressValues = Object.values(address).filter(Boolean) as string[];
  const searchableText = [payload.display_name ?? "", ...addressValues].join(" ");
  const serviceArea = detectServiceArea(searchableText);
  const label =
    [address.suburb, address.neighbourhood, address.city_district, address.city, address.town, address.state]
      .filter(Boolean)
      .slice(0, 3)
      .join(", ") || payload.display_name || "Detected location";
  const detectedCity = address.city || address.town || address.city_district || address.state || "";

  return { label, detectedCity, serviceArea };
}

// ---- Optional Google Places loader (key-gated, dependency-free) -------------

declare global {
  interface Window {
    google?: any;
    __aegisGooglePlaces__?: Promise<any | null>;
  }
}

export function getGoogleMapsApiKey(): string {
  return (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "").trim();
}

/**
 * Loads the Google Maps JS API (Places library) once. Resolves the `google`
 * namespace, or `null` if no key is configured or the script fails to load.
 */
export function loadGooglePlaces(): Promise<any | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }
  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.resolve(null);
  }
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }
  if (window.__aegisGooglePlaces__) {
    return window.__aegisGooglePlaces__;
  }

  window.__aegisGooglePlaces__ = new Promise<any | null>((resolve) => {
    const resolveReady = () => resolve(window.google?.maps?.places ? window.google : null);
    const existing = document.getElementById("aegis-google-maps") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", resolveReady);
      existing.addEventListener("error", () => resolve(null));
      return;
    }
    const script = document.createElement("script");
    script.id = "aegis-google-maps";
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    script.addEventListener("load", resolveReady);
    script.addEventListener("error", () => resolve(null));
    document.head.appendChild(script);
  }).catch(() => null);

  return window.__aegisGooglePlaces__;
}
