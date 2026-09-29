import type { ExceptionReviewView } from "../../../../lib/payment-exception-review";

export type PaymentRow = {
  id: string;
  amountPaise: number;
  status: string;
  source: string;
  recordType: string;
  method: string | null;
  providerPaymentId: string | null;
  externalTxnRef: string | null;
  note: string | null;
  collectedAt: string | null;
  createdAt: string;
  reversesPaymentId: string | null;
};

export type LedgerCause = { kind: "PAYMENT"; paymentId: string } | { kind: "REVISION"; revisionNumber: number };

/** One period in which collections exceeded the approved amount, replayed by the API from the append-only ledger. */
export type OvercollectionEpisode = {
  startedAt: string;
  startedBy: LedgerCause;
  peakOvercollectedPaise: number;
  endedAt: string | null;
  endedBy: LedgerCause | null;
};

export type PaymentRequestRow = {
  id: string;
  amountPaise: number;
  status: string;
  providerStatus: string | null;
  providerLinkId: string | null;
  /** Sanitized provider reason for a rejected or unconfirmed Payment Link creation. */
  providerError: string | null;
  url: string | null;
  createdAt: string;
};

export type CommercialCase = {
  id: string;
  origin: "MASON_LEAD" | "ZOHO_LEAD";
  leadRecordId: string | null;
  zohoLeadId: string | null;
  customerName: string;
  phoneE164: string;
  email: string | null;
  locationText: string;
  city: "Goa" | "Mumbai" | null;
  assignedStaffId: string | null;
  exceptionNote: string | null;
  // Server-derived Google geocoding evidence; the city label alone never makes a case payable.
  verifiedLocationMarket: "GOA" | "BANGALORE" | "OTHER" | null;
  locationVerifiedAt: string | null;
  locationVerifiedByStaffId: string | null;
  locationEvidenceJson: null | {
    origin: "MASON_LEAD_LOCATION" | "ZOHO_LEAD_LOCATION" | "STAFF_PLACE_VERIFICATION";
    placeId: string | null;
    formattedAddress: string | null;
  };
  updatedAt: string;
  revisions: Array<{
    id: string;
    revisionNumber: number;
    status: string;
    packageCode: string;
    packageName: string;
    bathroomsCount: number;
    approvedAmountPaise: number;
    reason: string | null;
    approvedAt: string;
  }>;
  order: null | {
    id: string;
    orderNumber: string;
    currentRevisionId: string;
    paymentRequests: PaymentRequestRow[];
    payments: PaymentRow[];
  };
  // Server-derived. outstanding is never negative; overcollection is reported separately.
  balance: null | {
    approvedAmountPaise: number;
    collectedPaise: number;
    balancePaise: number;
    outstandingPaise: number;
    overcollectedPaise: number;
    paymentState: string;
  };
  // Audit history; stays visible after the overcollection is resolved. Absent from older API builds.
  overcollectionHistory?: OvercollectionEpisode[];
  // Server-derived review state of the provider/operational exception note. Absent from older API builds.
  exceptionReview?: ExceptionReviewView | null;
};

export function rupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}
