"use client";

import { useEffect, useRef, useState } from "react";
import { loadGooglePlaces } from "../../../../lib/location";

/**
 * Selects a Google place for server-side verification. Only the place ID is submitted;
 * the API geocodes it and decides the market, so typed text is never evidence.
 * Deliberately not the public form hook: staff selections must not emit marketing analytics.
 */
export default function PlacePicker() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [placeId, setPlaceId] = useState("");
  const [address, setAddress] = useState("");
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let listener: { remove?: () => void } | undefined;
    loadGooglePlaces().then((google) => {
      if (cancelled) return;
      if (!google || !inputRef.current) { setUnavailable(true); return; }
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        fields: ["place_id", "formatted_address"], componentRestrictions: { country: "in" }
      });
      listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        setPlaceId(place?.place_id ?? "");
        setAddress(place?.formatted_address ?? "");
      });
    }).catch(() => { if (!cancelled) setUnavailable(true); });
    return () => { cancelled = true; listener?.remove?.(); };
  }, []);

  if (unavailable) {
    return <label>Google Place ID of the service address
      <input name="placeId" required minLength={10} maxLength={512} pattern="[A-Za-z0-9_\-]{10,512}" placeholder="Google Places is unavailable — paste a Place ID" />
    </label>;
  }
  return <>
    <label>Customer service address
      <input ref={inputRef} type="text" autoComplete="off" placeholder="Search the full address and pick a suggestion"
        onChange={() => { setPlaceId(""); setAddress(""); }} />
    </label>
    <input type="hidden" name="placeId" value={placeId} />
    {address && <p>Selected: {address}</p>}
    <button type="submit" disabled={!placeId}>Verify selected address</button>
  </>;
}
