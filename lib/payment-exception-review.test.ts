import assert from "node:assert/strict";
import test from "node:test";
import { exceptionListLabel, exceptionReviewOf, RESOLUTION_NOTE_MESSAGE, resolutionNoteFrom, REVIEW_DISCLAIMER } from "./payment-exception-review";

test("the API's review state is used as-is; a raw note without it is treated as unreviewed", () => {
  const reviewed = { status: "REVIEWED" as const, version: "10.abc", unresolvedNote: null, reviewedNote: "Old exception.", reviews: [] };
  assert.equal(exceptionReviewOf({ exceptionNote: "Old exception.", exceptionReview: reviewed }), reviewed);
  assert.deepEqual(exceptionReviewOf({ exceptionNote: " Legacy note. " }),
    { status: "UNRESOLVED", version: null, unresolvedNote: "Legacy note.", reviewedNote: null, reviews: [] });
  assert.equal(exceptionReviewOf({ exceptionNote: null }).status, "NONE");
  assert.equal(exceptionReviewOf({ exceptionNote: "   " }).status, "NONE");
});

test("only an unreviewed exception is flagged in the case list; reviewed history is not", () => {
  assert.equal(exceptionListLabel("UNRESOLVED"), "Exception — review required");
  assert.equal(exceptionListLabel("REVIEWED"), null);
  assert.equal(exceptionListLabel("NONE"), null);
});

test("resolution notes are required and trimmed; the review is described as an administrative record", () => {
  assert.equal(resolutionNoteFrom("  Verified in Razorpay.  "), "Verified in Razorpay.");
  for (const bad of [null, "", "     ", " ok ", "x".repeat(2001)]) assert.throws(() => resolutionNoteFrom(bad), new RegExp(RESOLUTION_NOTE_MESSAGE.replace(/[()]/g, "\\$&")));
  assert.match(REVIEW_DISCLAIMER, /does not alter payments, collections or provider records/);
  assert.doesNotMatch(REVIEW_DISCLAIMER, /\b(clear|delete|dismiss|remove)\b/i);
});
