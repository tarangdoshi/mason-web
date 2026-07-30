import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERIC_SUBMIT_ERROR,
  NETWORK_SUBMIT_ERROR,
  createSubmissionGate,
  submitGuidanceLead
} from "./lead-submission";

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
