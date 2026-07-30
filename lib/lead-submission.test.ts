import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERIC_SUBMIT_ERROR,
  NETWORK_SUBMIT_ERROR,
  createSubmissionGate,
  resolveValidationFeedback,
  submitGuidanceLead
} from "./lead-submission";

// The assessment form's inline-capable fields, in visual order.
const INLINE_ORDER = ["phone", "email"] as const;

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  } as unknown as Response;
}

const PAYLOAD = { customerName: "Test", phone: "+919971891017" };

test("2xx returns the created lead id and market", async () => {
  const result = await submitGuidanceLead(PAYLOAD, async () =>
    jsonResponse(201, { data: { id: "lead-1", locationMarket: "GOA" } })
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.leadId, "lead-1");
    assert.equal(result.locationMarket, "GOA");
  }
});

test("API 400 surfaces field-level validation errors", async () => {
  const result = await submitGuidanceLead(PAYLOAD, async () =>
    jsonResponse(400, {
      error: "Invalid guidance lead payload.",
      issues: { fieldErrors: { phone: ["Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9."] } }
    })
  );
  assert.equal(result.ok, false);
  if (!result.ok && result.kind === "validation") {
    assert.deepEqual(result.fieldErrors.phone?.length, 1);
    assert.match(result.message, /10-digit Indian mobile/);
  } else {
    assert.fail("expected a validation result");
  }
});

test("API 500 is reported as a retryable server error", async () => {
  const result = await submitGuidanceLead(PAYLOAD, async () => jsonResponse(500, {}));
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "server");
    assert.equal(result.message, GENERIC_SUBMIT_ERROR);
  }
});

test("network failure is reported without claiming success", async () => {
  const result = await submitGuidanceLead(PAYLOAD, async () => {
    throw new Error("offline");
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.kind, "network");
    assert.equal(result.message, NETWORK_SUBMIT_ERROR);
  }
});

test("a malformed success body still counts as success", async () => {
  const result = await submitGuidanceLead(PAYLOAD, async () =>
    ({ ok: true, status: 201, json: async () => { throw new Error("bad json"); } } as unknown as Response)
  );
  assert.equal(result.ok, true);
});

test("double-click cannot start a second submission while one is in flight", () => {
  const gate = createSubmissionGate();
  assert.equal(gate.tryBegin(), true);
  assert.equal(gate.tryBegin(), false);
  assert.equal(gate.tryBegin(), false);
});

test("a failed submission can be retried", () => {
  const gate = createSubmissionGate();
  assert.equal(gate.tryBegin(), true);
  gate.release();
  assert.equal(gate.tryBegin(), true);
});

test("a completed submission can never create a duplicate lead", () => {
  const gate = createSubmissionGate();
  gate.tryBegin();
  gate.complete();
  assert.equal(gate.isCompleted, true);
  assert.equal(gate.tryBegin(), false);
});

test("only one request is sent for a rapid double submit", async () => {
  const gate = createSubmissionGate();
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    return jsonResponse(201, { data: { id: "lead-1", locationMarket: "GOA" } });
  };

  const attempts = await Promise.all(
    [1, 2, 3].map(async () => {
      if (!gate.tryBegin()) {
        return "blocked";
      }
      const result = await submitGuidanceLead(PAYLOAD, fakeFetch);
      gate.complete();
      return result.ok ? "sent" : "failed";
    })
  );

  assert.equal(calls, 1);
  assert.deepEqual(attempts.filter((a) => a === "sent").length, 1);
  assert.deepEqual(attempts.filter((a) => a === "blocked").length, 2);
});

test("an API-side phone error focuses Phone and shows only the inline error", () => {
  const feedback = resolveValidationFeedback(
    { fieldErrors: { phone: ["Enter a valid 10-digit Indian mobile number starting with 6, 7, 8 or 9."] }, message: "generic" },
    INLINE_ORDER
  );
  assert.equal(feedback.focusField, "phone");
  assert.match(feedback.fieldErrors.phone, /10-digit Indian mobile/);
  assert.equal(feedback.bannerMessage, null, "the generic banner must be suppressed");
});

test("an API-side email error focuses Email and shows only the inline error", () => {
  const feedback = resolveValidationFeedback(
    { fieldErrors: { email: ["Enter a valid email address, for example name@example.com."] }, message: "generic" },
    INLINE_ORDER
  );
  assert.equal(feedback.focusField, "email");
  assert.match(feedback.fieldErrors.email, /valid email address/);
  assert.equal(feedback.bannerMessage, null, "the generic banner must be suppressed");
});

test("with several field errors the first in visual order is focused", () => {
  const feedback = resolveValidationFeedback(
    { fieldErrors: { email: ["bad email"], phone: ["bad phone"] }, message: "generic" },
    INLINE_ORDER
  );
  assert.equal(feedback.focusField, "phone");
  assert.equal(feedback.fieldErrors.email, "bad email");
  assert.equal(feedback.fieldErrors.phone, "bad phone");
});

test("a field without an inline error keeps the generic banner", () => {
  const feedback = resolveValidationFeedback(
    { fieldErrors: { customerName: ["Too small"] }, message: "Please check the highlighted fields and try again." },
    INLINE_ORDER
  );
  assert.equal(feedback.focusField, null);
  assert.equal(feedback.bannerMessage, "Please check the highlighted fields and try again.");
  assert.equal(feedback.fieldErrors.customerName, "Too small");
});

test("a validation failure carrying no field errors still shows the banner", () => {
  const feedback = resolveValidationFeedback({ fieldErrors: {}, message: "Invalid guidance lead payload." }, INLINE_ORDER);
  assert.equal(feedback.focusField, null);
  assert.equal(feedback.bannerMessage, "Invalid guidance lead payload.");
});

test("a non-field server error still shows the generic banner", async () => {
  const server = await submitGuidanceLead(PAYLOAD, async () => jsonResponse(500, {}));
  assert.equal(server.ok, false);
  if (!server.ok) {
    assert.equal(server.kind, "server");
    assert.equal(server.message, GENERIC_SUBMIT_ERROR);
  }

  const network = await submitGuidanceLead(PAYLOAD, async () => {
    throw new Error("offline");
  });
  assert.equal(network.ok, false);
  if (!network.ok) {
    assert.equal(network.kind, "network");
    assert.equal(network.message, NETWORK_SUBMIT_ERROR);
  }
});

test("a failed submission never instructs the form to clear entered values", async () => {
  // The failure path returns feedback only: no reset, no field clearing.
  const result = await submitGuidanceLead(PAYLOAD, async () =>
    jsonResponse(400, { error: "Invalid guidance lead payload.", issues: { fieldErrors: { email: ["bad"] } } })
  );
  assert.equal(result.ok, false);
  if (!result.ok && result.kind === "validation") {
    const feedback = resolveValidationFeedback(result, INLINE_ORDER);
    assert.deepEqual(Object.keys(feedback), ["fieldErrors", "focusField", "bannerMessage"]);
  } else {
    assert.fail("expected a validation result");
  }
});

test("duplicate-submission protection survives repeated validation failures", async () => {
  const gate = createSubmissionGate();
  let calls = 0;
  const failing = async () => {
    calls += 1;
    return jsonResponse(400, { error: "Invalid guidance lead payload.", issues: { fieldErrors: { email: ["bad"] } } });
  };

  // Two sequential failed attempts: each sends exactly one request and the gate
  // reopens so the customer can correct the field and retry.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    assert.equal(gate.tryBegin(), true);
    assert.equal(gate.tryBegin(), false, "a second click while pending must be refused");
    await submitGuidanceLead(PAYLOAD, failing);
    gate.release();
  }
  assert.equal(calls, 2);

  // A successful retry then closes the gate permanently.
  assert.equal(gate.tryBegin(), true);
  gate.complete();
  assert.equal(gate.tryBegin(), false);
  assert.equal(gate.isCompleted, true);
});
