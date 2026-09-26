import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { isAllowedAnalyticsEventName } from "./analytics";
import { isSelectedLocationStale, manualLocationMeta } from "./location";
import { ASSESSMENT_AVAILABILITY_COPY, classifyGoogleAddress } from "./serviceability";

const countryIndia = { long_name: "India", short_name: "IN", types: ["country"] };
const state = (name: string) => ({ long_name: name, short_name: name, types: ["administrative_area_level_1"] });
const locality = (name: string) => ({ long_name: name, short_name: name, types: ["locality"] });

test("client location classification recognises Goa, Bangalore, other, and unknown markets", () => {
  assert.equal(
    classifyGoogleAddress([countryIndia, state("Goa"), locality("Panaji")], { source: "GOOGLE_PLACES" }).locationMarket,
    "GOA"
  );
  assert.equal(
    classifyGoogleAddress([countryIndia, state("Karnataka"), locality("Bengaluru")], { source: "GOOGLE_PLACES" })
      .locationMarket,
    "BANGALORE"
  );
  assert.equal(
    classifyGoogleAddress([countryIndia, state("Maharashtra"), locality("Mumbai")], { source: "GOOGLE_PLACES" })
      .locationMarket,
    "OTHER"
  );
  assert.equal(manualLocationMeta("Near the market").serviceability.locationMarket, "UNKNOWN");
});

test("editing a selected address clears stale verified location metadata", () => {
  assert.equal(isSelectedLocationStale("Panaji, Goa, India", "Panaji market, Goa, India"), true);
  const replacement = manualLocationMeta("Panaji market, Goa, India");
  assert.equal(replacement.placeId, undefined);
  assert.equal(replacement.lat, undefined);
  assert.equal(replacement.lng, undefined);
  assert.equal(replacement.serviceability.locationMarket, "UNKNOWN");
});

test("assessment form renders the Goa-only public launch copy", () => {
  assert.equal(ASSESSMENT_AVAILABILITY_COPY, "Mason is currently available in Goa.");
  const formSource = readFileSync(resolve(process.cwd(), "app/components/assessment-lead-form.tsx"), "utf8");
  assert.match(formSource, /ASSESSMENT_AVAILABILITY_COPY/);
});

test("location analytics events are part of the typed allowlist", () => {
  assert.equal(isAllowedAnalyticsEventName("location_picker_success"), true);
  assert.equal(isAllowedAnalyticsEventName("location_picker_fallback"), true);
  assert.equal(isAllowedAnalyticsEventName("lead_location_market"), true);
});
