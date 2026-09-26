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
  ["total-support-solution", 1],
  ["raised-toilet-seat", undefined]
] as const;

test("the public kit keeps the locked components and quantities", () => {
  assert.deepEqual(KIT.map((item) => [item.id, item.qty]), expectedKit);
  assert.equal(KIT.some((item) => /sensor|sos|commode/i.test(item.title)), false);
  assert.equal(KIT.find((item) => item.id === "raised-toilet-seat")?.title, "Raised Toilet Seat");
});

test("Standard and Advanced share the same kit and locked current/reference prices", () => {
  const plans = homepageContent.packagesSection.plans;
  assert.deepEqual(plans[0]?.includedFeatureIds, plans[1]?.includedFeatureIds);
  assert.equal(plans[0]?.includedFeatureIds.length, 13);
  assert.equal(homepageContent.packagesSection.features.find((feature) => feature.id === "raised-toilet-seat")?.quantity, undefined);
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


test("legacy CMS package descriptions cannot change the shared-kit launch offer", async () => {
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||= "testproject";
  const { applySanityPackages, applyFounderPackageOffer } = await import("./site-content");
  const packages = homepageContent.packagesSection.plans.map((plan) => ({
    code: plan.id, name: plan.name, bestFor: "Premium hardware and stronger sit-stand support",
    outcome: "Extra slippers and PVD upgrades", summary: "A different physical kit",
    badge: "Extra components", titleDescriptor: "Premium hardware", visualHighlights: ["Sensor lighting"],
    referencePrice: plan.referencePrice, currentPrice: plan.name === "Standard" ? "₹30,000" : "₹37,000",
  }));
  const result = applyFounderPackageOffer(applySanityPackages(homepageContent, packages, [])).packagesSection.plans;
  assert.equal(result.length, 2);
  assert.doesNotMatch(JSON.stringify(result.map(({ bestFor, outcome, summary, badge, titleDescriptor, visualHighlights }) => ({ bestFor, outcome, summary, badge, titleDescriptor, visualHighlights }))), /PVD|extra slippers|sensor lighting|different physical kit|premium hardware/i);
  assert.deepEqual(result.map((plan) => plan.includedFeatureIds), homepageContent.packagesSection.plans.map((plan) => plan.includedFeatureIds));
  assert.deepEqual(result.map((plan) => [plan.referencePrice, plan.currentPrice, plan.price]), homepageContent.packagesSection.plans.map((plan) => [plan.referencePrice, plan.currentPrice, plan.currentPrice]));
});
