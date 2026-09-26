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

test("Advanced differs only through the approved two-year safety check-up", () => {
  const plans = homepageContent.packagesSection.plans;
  assert.equal(plans[0]?.isFeatured, true);
  assert.equal(plans[1]?.isFeatured, false);
  assert.match(plans[1]?.badge || "", /two years of cover/i);
  assert.match(plans[1]?.bestFor || "", /safety check-up two years on/i);
  assert.match(plans[1]?.outcome || "", /same upgrade, looked after/i);
});


test("legacy CMS package descriptions cannot change the shared-kit launch offer", async () => {
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||= "testproject";
  const { applySanityPackages } = await import("./site-content");
  const packages = homepageContent.packagesSection.plans.map((plan) => ({
    code: plan.id, name: plan.name, bestFor: "Premium hardware and stronger sit-stand support",
    outcome: "Extra slippers and PVD upgrades", summary: "A different physical kit",
    badge: "Extra components", titleDescriptor: "Premium hardware", visualHighlights: ["Sensor lighting"],
    referencePrice: plan.referencePrice, currentPrice: plan.currentPrice,
  }));
  const result = applySanityPackages(homepageContent, packages, []).packagesSection.plans;
  assert.equal(result.length, 2);
  assert.doesNotMatch(JSON.stringify(result.map(({ bestFor, outcome, summary, badge, titleDescriptor, visualHighlights }) => ({ bestFor, outcome, summary, badge, titleDescriptor, visualHighlights }))), /PVD|extra slippers|sensor lighting|different physical kit|premium hardware/i);
  assert.deepEqual(result.map((plan) => plan.includedFeatureIds), homepageContent.packagesSection.plans.map((plan) => plan.includedFeatureIds));
  assert.deepEqual(result.map((plan) => [plan.referencePrice, plan.currentPrice]), packages.map((plan) => [plan.referencePrice, plan.currentPrice]));
});
