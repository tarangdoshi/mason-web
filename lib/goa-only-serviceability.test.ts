import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { classifyGoogleAddress, unknownServiceability } from "./serviceability";
import { detectServiceArea } from "./checkout-service-area";

/*
 * Mason operates in Goa only. Classification keeps its markets (GOA / BANGALORE / OTHER / UNKNOWN),
 * but only Goa is serviceable for new work, and public enquiry capture is never gated by location.
 */
const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const india = { long_name: "India", short_name: "IN", types: ["country"] };
const state = (name: string) => ({ long_name: name, short_name: name, types: ["administrative_area_level_1"] });
const locality = (name: string) => ({ long_name: name, short_name: name, types: ["locality"] });

test("serviceability status: Goa serviceable; Bangalore and other markets out of area; unknown stays unknown", () => {
  const goa = classifyGoogleAddress([india, state("Goa"), locality("Panaji")], { source: "GOOGLE_PLACES" });
  const bangalore = classifyGoogleAddress([india, state("Karnataka"), locality("Bengaluru")], { source: "GOOGLE_PLACES" });
  const mumbai = classifyGoogleAddress([india, state("Maharashtra"), locality("Mumbai")], { source: "GOOGLE_PLACES" });
  const unknown = unknownServiceability({ formattedAddress: "Near the market" });
  assert.deepEqual([goa.locationMarket, goa.status], ["GOA", "SERVICEABLE"]);
  assert.deepEqual([bangalore.locationMarket, bangalore.marketLabel, bangalore.status], ["BANGALORE", "Bangalore", "OUT_OF_AREA"]);
  assert.deepEqual([mumbai.locationMarket, mumbai.status], ["OTHER", "OUT_OF_AREA"]);
  assert.deepEqual([unknown.locationMarket, unknown.status], ["UNKNOWN", "UNKNOWN"]);
});

test("checkout service-area check is Goa only", () => {
  for (const goa of ["Panaji, Goa", "Mapusa", "Margao", "Vasco da Gama", "Porvorim, North Goa"]) assert.equal(detectServiceArea(goa), "Goa", goa);
  for (const elsewhere of ["Andheri West, Mumbai", "Thane", "Navi Mumbai", "Bombay", "Indiranagar, Bengaluru", "Bangalore", "Pune", ""]) {
    assert.equal(detectServiceArea(elsewhere), null, elsewhere);
  }
  const checkout = read("app/(marketing)/checkout/components/checkout-experience.tsx");
  assert.doesNotMatch(checkout, /mumbai|Mumbai Metro/i, "no Mumbai service area left in checkout");
});

test("public enquiry capture is never gated by serviceability status", () => {
  for (const file of ["app/components/assessment-lead-form.tsx", "components/ContactForm.tsx"]) {
    const source = read(file);
    assert.doesNotMatch(source, /serviceability\.status|"SERVICEABLE"|"OUT_OF_AREA"/, `${file} must accept enquiries from anywhere`);
  }
});
