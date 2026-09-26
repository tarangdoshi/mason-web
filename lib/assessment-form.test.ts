import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const formSource = readFileSync(resolve(process.cwd(), "app/components/assessment-lead-form.tsx"), "utf8");
const phoneSource = readFileSync(resolve(process.cwd(), "app/components/phone-field.tsx"), "utf8");

test("public booking form matches the approved Prerna field set and copy", () => {
  assert.match(formSource, /Full name/);
  assert.match(phoneSource, /Mobile number/);
  assert.match(formSource, /Email address/);
  assert.match(formSource, /<LocationAutocompleteField/);
  assert.match(formSource, /Request my visit/);
  assert.doesNotMatch(formSource, /assessmentType/);
  assert.doesNotMatch(formSource, /Optional notes \/ concern/);
  assert.doesNotMatch(formSource, /Book Free Safety Assessment/);
  assert.match(formSource, /<LeadPrivacyNotice/);
  assert.match(formSource, /Visit request received/);
  assert.doesNotMatch(formSource, /Assessment received/);
});

test("simplified booking keeps the real lead metadata and neutral required topic", () => {
  assert.match(formSource, /enquiryTopic: "Bathroom safety visit"/);
  assert.match(formSource, /getLeadAttributionContext/);
  assert.match(formSource, /getQuizContext/);
  assert.match(formSource, /locationMarket: resolvedLocationMeta\.serviceability\.locationMarket/);
  assert.match(formSource, /serviceability: resolvedLocationMeta\.serviceability/);
  assert.match(formSource, /location: resolvedLocationMeta/);
  assert.match(formSource, /locationText: locationText\.trim\(\)\.length >= 2 \? locationText : "Address not provided"/);
});
