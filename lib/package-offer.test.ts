import assert from "node:assert/strict";
import test from "node:test";
import { homepageContent } from "../content/homepage.content";
import { fallbackPackages } from "./cms/fallback";
import { resolvePackages } from "./cms/resolve";

const expectedKit = [
  ["vertical-grab-bars", 3],
  ["angled-grab-bar", 1],
  ["folding-bar", 1],
  ["anti-slip-coating", 1],
  ["anti-slip-mat-shower", 1],
  ["anti-slip-mat-post-shower", 1],
  ["shower-stool", 1],
  ["two-way-lock", 1],
  ["corner-safety", 1],
  ["drainage-solution", 4],
  ["slippers-one", 1],
  ["total-support-solution", 1],
  ["raised-toilet-seat", 1]
] as const;

test("the public kit keeps the locked components and quantities", () => {
  const kit = fallbackPackages.components;
  assert.deepEqual(kit.map((item) => [item.id, item.quantity]), expectedKit);
  assert.equal(kit.some((item) => /sensor|sos|commode/i.test(item.title)), false);
  assert.equal(kit.find((item) => item.id === "raised-toilet-seat")?.title, "Raised Toilet Seat");
});

test("Standard and Advanced share the same kit and locked current/reference prices", () => {
  const plans = homepageContent.packagesSection.plans;
  assert.deepEqual(plans[0]?.includedFeatureIds, plans[1]?.includedFeatureIds);
  assert.equal(plans[0]?.includedFeatureIds.length, 13);
  assert.equal(homepageContent.packagesSection.features.find((feature) => feature.id === "raised-toilet-seat")?.quantity, 1);
  assert.deepEqual(
    plans.map((plan) => [plan.name, plan.referencePrice, plan.currentPrice]),
    [
      ["Standard", "₹35,000", "₹29,999"],
      ["Advanced", "₹44,000", "₹36,999"]
    ]
  );
});

test("Advanced differs only through the approved 2-Year Safety AMC", () => {
  const plans = homepageContent.packagesSection.plans;
  assert.equal(plans[0]?.isFeatured, true);
  assert.equal(plans[1]?.isFeatured, false);
  assert.equal(plans[1]?.badge, "2-Year Safety AMC Included");
  assert.equal(plans[1]?.bestFor, "Includes annual safety visits for 2 years after installation. We inspect the installed safety setup and fix, change or replace items where required.");
  assert.match(plans[1]?.outcome || "", /same upgrade, looked after/i);
});

test("package prices resolve from Sanity when set, with the struck price exactly as the editor set it", () => {
  const cms = resolvePackages([
    { code: "package-standard", priceInr: 31999, referencePriceInr: 36000 },
    { code: "package-advanced", priceInr: 38999 }
  ], null).plans;
  assert.deepEqual(cms.map((plan) => [plan.name, plan.price, plan.referencePrice]), [["Standard", "₹31,999", "₹36,000"], ["Advanced", "₹38,999", undefined]]);
  // Missing or invalid prices fall back to the approved values.
  const fallback = resolvePackages([{ code: "package-standard", priceInr: -5 }, { code: "package-advanced" }], null).plans;
  assert.deepEqual(fallback.map((plan) => [plan.price, plan.referencePrice]), [["₹29,999", "₹35,000"], ["₹36,999", "₹44,000"]]);
});
