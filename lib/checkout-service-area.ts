/* The checkout page's quick service-area check, before a booking request is prepared. Mason
   operates in Goa only. This is a convenience gate in the browser; mason-api re-verifies every
   checkout location server-side (Google Geocoding) and only a verified Goa address becomes a
   BOOKING_REQUEST or can ever receive a payment link. */
export type ServiceArea = "Goa";

export const SERVICE_UNAVAILABLE_MESSAGE = "Service currently not available in your area, we will be there soon.";

const GOA_TOKENS = ["goa", "north goa", "south goa", "panaji", "mapusa", "margao", "madgaon", "vasco", "porvorim"];

export function detectServiceArea(rawText: string): ServiceArea | null {
  const haystack = rawText.toLowerCase();
  return GOA_TOKENS.some((token) => haystack.includes(token)) ? "Goa" : null;
}
