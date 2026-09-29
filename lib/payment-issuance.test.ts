import assert from "node:assert/strict";
import test from "node:test";
import { ISSUANCE_DISABLED_MESSAGE, ISSUANCE_UNAVAILABLE_MESSAGE, issueIfEnabled, issuanceNotice, readPaymentIssuance } from "./payment-issuance";

const status = (data: unknown) => async () => ({ data });

test("issuance is enabled only on an explicit enabled: true from the API", async () => {
  assert.deepEqual(await readPaymentIssuance(status({ schemaReady: true, issuance: { enabled: true } })),
    { enabled: true, reason: "enabled", problems: [] });
  for (const data of [{ issuance: { enabled: false } }, { issuance: { enabled: "true" } }, { issuance: {} }, {}, null, "enabled"]) {
    const state = await readPaymentIssuance(status(data));
    assert.deepEqual([state.enabled, state.reason], [false, "disabled"], JSON.stringify(data));
  }
  assert.deepEqual([(await readPaymentIssuance(async () => null)).enabled, (await readPaymentIssuance(async () => "x")).enabled], [false, false]);
});

test("an unreachable or older API (status route missing) fails closed as unavailable", async () => {
  for (const failure of [new Error("404"), new TypeError("fetch failed")]) {
    const state = await readPaymentIssuance(async () => { throw failure; });
    assert.deepEqual(state, { enabled: false, reason: "unavailable", problems: [] });
    assert.equal(issuanceNotice(state), ISSUANCE_UNAVAILABLE_MESSAGE);
  }
  assert.equal(issuanceNotice({ enabled: false, reason: "disabled", problems: [] }), ISSUANCE_DISABLED_MESSAGE);
  assert.equal(issuanceNotice({ enabled: true, reason: "enabled", problems: [] }), null);
});

test("ADMIN problem codes pass through as strings only", async () => {
  const state = await readPaymentIssuance(status({ issuance: { enabled: false }, problems: ["RAZORPAY_TEST_KEY_IN_PRODUCTION", 7, { value: "x" }] }));
  assert.deepEqual(state.problems, ["RAZORPAY_TEST_KEY_IN_PRODUCTION"]);
});

test("the CRM never initiates issuance while the kill switch is off or unconfirmed", async () => {
  let creates = 0;
  const create = async () => { creates += 1; return "link"; };
  assert.deepEqual(await issueIfEnabled(status({ issuance: { enabled: false } }), create), { issued: false, message: ISSUANCE_DISABLED_MESSAGE });
  assert.deepEqual(await issueIfEnabled(async () => { throw new Error("down"); }, create), { issued: false, message: ISSUANCE_UNAVAILABLE_MESSAGE });
  assert.equal(creates, 0);
  assert.deepEqual(await issueIfEnabled(status({ issuance: { enabled: true } }), create), { issued: true, result: "link" });
  assert.equal(creates, 1);
});
