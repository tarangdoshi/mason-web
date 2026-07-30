import assert from "node:assert/strict";
import test from "node:test";
import {
  formatNationalMobile,
  isValidNationalMobile,
  normalizeIndianMobileToE164,
  sanitizePhoneInput,
  toE164
} from "./phone";

const NATIONAL = "9971891017";
const E164 = "+919971891017";

test("pasted formats reduce to the same ten national digits", () => {
  for (const input of [
    "9971891017",
    "+91 99718 91017",
    "09971891017",
    "99718-91017",
    "(99718) 91017",
    "+919971891017",
    "919971891017",
    "  99718 91017  ",
    "091 99718 91017"
  ]) {
    assert.equal(sanitizePhoneInput(input), NATIONAL, `expected ${input} to sanitize`);
  }
});

test("typed digits are preserved and capped at ten", () => {
  assert.equal(sanitizePhoneInput("9"), "9");
  assert.equal(sanitizePhoneInput("99718"), "99718");
  assert.equal(sanitizePhoneInput("99718910177777"), NATIONAL);
});

test("letters and symbols are ignored in the editable portion", () => {
  assert.equal(sanitizePhoneInput("99a71b89c1017"), NATIONAL);
  assert.equal(sanitizePhoneInput("abc"), "");
});

test("a leading zero can never start the national number", () => {
  assert.equal(sanitizePhoneInput("0"), "");
  assert.equal(sanitizePhoneInput("0997"), "997");
});

test("display formatting groups as 5 + 5", () => {
  assert.equal(formatNationalMobile(""), "");
  assert.equal(formatNationalMobile("99718"), "99718");
  assert.equal(formatNationalMobile("997189"), "99718 9");
  assert.equal(formatNationalMobile(NATIONAL), "99718 91017");
});

test("validity requires ten digits starting 6-9", () => {
  assert.equal(isValidNationalMobile(NATIONAL), true);
  assert.equal(isValidNationalMobile("6971891017"), true);
  assert.equal(isValidNationalMobile("5971891017"), false);
  assert.equal(isValidNationalMobile("997189101"), false);
  assert.equal(isValidNationalMobile(""), false);
});

test("E.164 conversion matches the API contract", () => {
  assert.equal(toE164(NATIONAL), E164);
  assert.equal(toE164("997189101"), null);
  assert.equal(normalizeIndianMobileToE164("+91 99718 91017"), E164);
  assert.equal(normalizeIndianMobileToE164("5971891017"), null);
});

test("a genuine number beginning 91 is not treated as a country code", () => {
  assert.equal(sanitizePhoneInput("9198765432"), "9198765432");
  assert.equal(toE164("9198765432"), "+919198765432");
});
