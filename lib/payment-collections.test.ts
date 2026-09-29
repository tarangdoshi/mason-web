import assert from "node:assert/strict";
import test from "node:test";
import { paymentStateLabel, rupeeInputValue } from "./payment-collections";

test("collection states are labelled plainly; overcollection is never shown as an ordinary exact payment", () => {
  assert.equal(paymentStateLabel("UNPAID"), "Nothing collected");
  assert.equal(paymentStateLabel("PARTIALLY_PAID"), "Partially collected");
  assert.equal(paymentStateLabel("PAID"), "Fully collected");
  assert.equal(paymentStateLabel("OVERPAID_EXCEPTION"), "Overcollected — admin review");
  assert.notEqual(paymentStateLabel("OVERPAID_EXCEPTION"), paymentStateLabel("PAID"));
  assert.equal(paymentStateLabel(undefined), "Awaiting approval");
  assert.equal(paymentStateLabel("SOMETHING_NEW"), "SOMETHING NEW");
});

test("the partial-amount field is prefilled with the full outstanding balance in rupees", () => {
  assert.equal(rupeeInputValue(3_699_900), "36999.00");
  assert.equal(rupeeInputValue(1_699_950), "16999.50");
  assert.equal(rupeeInputValue(1), "0.01");
});
