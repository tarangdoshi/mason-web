import assert from "node:assert/strict";
import test from "node:test";
import { ledgerCauseLabel, paymentStateLabel, rupeeInputValue } from "./payment-collections";

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

test("overcollection history names the ledger entry that started or resolved it", () => {
  const payments = [
    { id: "p1", amountPaise: 100_000, source: "OFFLINE", recordType: "COLLECTION", method: "CASH" },
    { id: "p2", amountPaise: 100_000, source: "OFFLINE", recordType: "REVERSAL", method: "CASH" },
    { id: "p3", amountPaise: 250_000, source: "RAZORPAY", recordType: "COLLECTION", method: null }
  ];
  assert.equal(ledgerCauseLabel({ kind: "PAYMENT", paymentId: "p1" }, payments), "Collection by cash ₹1,000.00");
  assert.equal(ledgerCauseLabel({ kind: "PAYMENT", paymentId: "p2" }, payments), "Reversal of cash ₹1,000.00");
  assert.equal(ledgerCauseLabel({ kind: "PAYMENT", paymentId: "p3" }, payments), "Collection by Razorpay ₹2,500.00");
  assert.equal(ledgerCauseLabel({ kind: "REVISION", revisionNumber: 4 }, payments), "Revision 4");
  assert.equal(ledgerCauseLabel({ kind: "PAYMENT", paymentId: "missing" }, payments), "Ledger entry");
});
