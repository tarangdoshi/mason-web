import assert from "node:assert/strict";
import test from "node:test";
import { KIT } from "../components/kit";
import { homepageContent } from "../content/homepage.content";

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
  ["total-support-solution", 1]
] as const;

test("the public kit keeps the locked components and quantities", () => {
  assert.deepEqual(KIT.map((item) => [item.id, item.qty]), expectedKit);
  assert.equal(KIT.some((item) => /sensor|sos|commode|raised seat/i.test(item.title)), false);
});

test("Standard and Advanced share the same kit and locked current/reference prices", () => {
  const plans = homepageContent.packagesSection.plans;
  assert.deepEqual(plans[0]?.includedFeatureIds, plans[1]?.includedFeatureIds);
  assert.deepEqual(
    plans.map((plan) => [plan.name, plan.referencePrice, plan.currentPrice]),
    [
      ["Standard", "₹35,000", "₹30,000"],
      ["Advanced", "₹44,000", "₹37,000"]
    ]
  );
});

test("Advanced differs only through the included first-year safety check-up", () => {
  const plans = homepageContent.packagesSection.plans;
  assert.equal(plans[0]?.isFeatured, true);
  assert.equal(plans[1]?.isFeatured, false);
  assert.match(plans[1]?.badge || "", /1-Year Safety Check-Up Included/);
  assert.match(plans[1]?.bestFor || "", /one included safety check-up during the first year/i);
  assert.match(plans[1]?.outcome || "", /one technician visit within the first year/i);
});
