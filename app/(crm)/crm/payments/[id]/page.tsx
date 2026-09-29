import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, apiFetch } from "../../../../../lib/api";
import { getCrmSessionToken, requireCrmUser } from "../../../../../lib/crm";
import { issuanceNotice, PAYMENT_STATUS_PATH, readPaymentIssuance } from "../../../../../lib/payment-issuance";
import { ledgerCauseLabel, paymentStateLabel, rupeeInputValue } from "../../../../../lib/payment-collections";
import { exceptionReviewOf, MAX_RESOLUTION_NOTE, MIN_RESOLUTION_NOTE, REVIEW_DISCLAIMER } from "../../../../../lib/payment-exception-review";
import CrmShell from "../../crm-shell";
import { approveRevisionAction, cancelPaymentLinkAction, createPaymentLinkAction, reconcilePaymentLinkAction, recordOfflineCollectionAction, reverseOfflineCollectionAction, reviewPaymentExceptionAction, verifyLocationAction } from "../actions";
import PlacePicker from "../place-picker";
import { rupees, type CommercialCase } from "../types";
import styles from "../payments.module.css";

type PackageOption = { id: string; code: string; name: string; city: string; active: boolean };
const LOCATION_ORIGIN_LABEL = {
  MASON_LEAD_LOCATION: "Mason lead's Google-selected location",
  ZOHO_LEAD_LOCATION: "Zoho lead's captured Google location",
  STAFF_PLACE_VERIFICATION: "Admin-selected Google place"
} as const;

export default async function PaymentCasePage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; message?: string }>;
}) {
  const user = await requireCrmUser();
  const token = await getCrmSessionToken();
  const { id } = await params;
  const feedback = (await searchParams) ?? {};
  let item: CommercialCase;
  try {
    item = (await apiFetch<{ data: CommercialCase }>(`/api/v1/internal/commercial-cases/${encodeURIComponent(id)}`, { token: token ?? undefined })).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  const packages = user.role === "ADMIN" ? (await apiFetch<{ data: PackageOption[] }>("/api/v1/internal/content/packages", { token: token ?? undefined })).data
    .filter((option) => option.active && option.city === item.city) : [];
  const issuance = await readPaymentIssuance(() => apiFetch(PAYMENT_STATUS_PATH, { token: token ?? undefined }));
  const issuanceMessage = issuanceNotice(issuance);
  const currentRevision = item.revisions.find((revision) => revision.id === item.order?.currentRevisionId);
  const active = item.order?.paymentRequests.find((request) => request.status === "ACTIVE" && request.url);
  const locationVerifiedGoa = item.verifiedLocationMarket === "GOA" && item.city === "Goa";
  const exception = exceptionReviewOf(item);
  const canIssue = locationVerifiedGoa && !!currentRevision && !!item.balance && item.balance.outstandingPaise > 0 && exception.status !== "UNRESOLVED" &&
    !item.order?.paymentRequests.some((request) => ["ACTIVE", "PREPARING", "CANCEL_PENDING"].includes(request.status));
  const reversedIds = new Set(item.order?.payments.filter((payment) => payment.recordType === "REVERSAL").map((payment) => payment.reversesPaymentId) ?? []);

  return <CrmShell user={user} title={item.customerName} subtitle={`${item.origin === "ZOHO_LEAD" ? "Zoho Lead" : "Mason lead"} · ${item.city ?? "City unverified"} · ${item.order?.orderNumber ?? "Awaiting commercial approval"}`}>
    <div className={styles.stack}>
      <Link href="/crm/payments">← All commercial cases</Link>
      {feedback.error && <div className={styles.error} role="alert">{feedback.error}</div>}
      {feedback.message && <div className={styles.notice} role="status">{feedback.message}</div>}
      {exception.status === "UNRESOLVED" && <div className={styles.error} role="alert"><strong>Payment exception — review required. Stop sharing links.</strong> {exception.unresolvedNote}</div>}
      <section className={styles.panel}>
        <h3>Verified customer and source</h3>
        <div className={styles.facts}>
          <div><span>Source ID</span><strong>{item.zohoLeadId ?? item.leadRecordId}</strong></div>
          <div><span>Phone</span><strong>{item.phoneE164}</strong></div>
          <div><span>Email</span><strong>{item.email ?? "Not supplied"}</strong></div>
          <div><span>Location</span><strong>{item.locationText}</strong></div>
          <div><span>Assigned staff</span><strong>{item.assignedStaffId ?? "Unassigned"}</strong></div>
        </div>
      </section>
      <section className={styles.panel}>
        <h3>Payment location evidence</h3>
        {item.verifiedLocationMarket && item.locationEvidenceJson ? <div className={styles.facts}>
          <div><span>Verified market</span><strong>{item.verifiedLocationMarket}</strong></div>
          <div><span>Evidence</span><strong>Google geocoding · {LOCATION_ORIGIN_LABEL[item.locationEvidenceJson.origin]}</strong></div>
          <div><span>Resolved address</span><strong>{item.locationEvidenceJson.formattedAddress ?? "—"}</strong></div>
          <div><span>Verified</span><strong>{new Date(item.locationVerifiedAt!).toLocaleString("en-IN")}{item.locationVerifiedByStaffId ? ` by ${item.locationVerifiedByStaffId}` : ""}</strong></div>
        </div> : <p><strong>Unverified.</strong> Payment Links cannot be issued. A “Goa” city or service-area label copied from the lead or Zoho is not location evidence.</p>}
        {item.verifiedLocationMarket && !locationVerifiedGoa && <p>Payment Links are unavailable for this location.</p>}
        {user.role === "ADMIN" && item.verifiedLocationMarket !== "GOA" && <div className={styles.twoColumns}>
          <form action={verifyLocationAction} className={styles.form}>
            <input type="hidden" name="caseId" value={item.id} />
            <p>Re-check the Google location captured on the source {item.origin === "ZOHO_LEAD" ? "Zoho lead" : "Mason lead"}.</p>
            <button type="submit">Re-check source lead location</button>
          </form>
          <form action={verifyLocationAction} className={styles.form}>
            <input type="hidden" name="caseId" value={item.id} />
            <p>Or confirm the customer&rsquo;s service address with them and select it from Google. Mason re-geocodes it; typed text is not accepted.</p>
            <PlacePicker />
          </form>
        </div>}
      </section>
      <section className={styles.panel}>
        <h3>Approved amount and collections</h3>
        {item.balance ? <div className={styles.metrics}>
          <div><span>Approved</span><strong>{rupees(item.balance.approvedAmountPaise)}</strong></div>
          <div><span>Collected</span><strong>{rupees(item.balance.collectedPaise)}</strong></div>
          <div><span>Outstanding</span><strong>{rupees(item.balance.outstandingPaise)}</strong></div>
          {item.balance.overcollectedPaise > 0 && <div><span>Overcollected</span><strong>{rupees(item.balance.overcollectedPaise)}</strong></div>}
          <div><span>State</span><strong>{paymentStateLabel(item.balance.paymentState)}</strong></div>
        </div> : <p>No amount has been approved. Public package prices and browser totals are not payment authority.</p>}
        {item.balance && item.balance.overcollectedPaise > 0 && <div className={styles.error} role="alert">
          <strong>Admin review required:</strong> genuine collections exceed the approved amount by {rupees(item.balance.overcollectedPaise)}. Nothing is refunded or reversed automatically; resolve it with the customer and correct the records.
        </div>}
        <p>Collections from any method, online or offline, count towards the same approved amount.</p>
        {(item.overcollectionHistory?.length ?? 0) > 0 && <div className={styles.tableWrap}>
          <h4>Overcollection history</h4>
          <p>Derived from the payment ledger; kept after the overcollection is resolved.</p>
          <table>
            <thead><tr><th>From</th><th>Started by</th><th>Peak over approved</th><th>Resolved</th></tr></thead>
            <tbody>{item.overcollectionHistory!.map((episode) => <tr key={episode.startedAt}>
              <td>{new Date(episode.startedAt).toLocaleString("en-IN")}</td>
              <td>{ledgerCauseLabel(episode.startedBy, item.order?.payments ?? [])}</td>
              <td>{rupees(episode.peakOvercollectedPaise)}</td>
              <td>{episode.endedAt && episode.endedBy
                ? <>{new Date(episode.endedAt).toLocaleString("en-IN")} · {ledgerCauseLabel(episode.endedBy, item.order?.payments ?? [])}</>
                : "Open — blocks new Payment Links"}</td>
            </tr>)}</tbody>
          </table>
        </div>}
        {currentRevision && <p>Revision {currentRevision.revisionNumber}: {currentRevision.packageName} · {currentRevision.bathroomsCount} bathroom(s), approved {new Date(currentRevision.approvedAt).toLocaleString("en-IN")}.</p>}
      </section>
      {exception.status !== "NONE" && <section className={styles.panel}>
        <h3>Payment exception review</h3>
        {exception.status === "UNRESOLVED" ? <>
          <p><strong>Review required.</strong> {exception.unresolvedNote}</p>
          {item.balance && <p>Current position: approved {rupees(item.balance.approvedAmountPaise)} · collected {rupees(item.balance.collectedPaise)} · outstanding {rupees(item.balance.outstandingPaise)} · overcollected {rupees(item.balance.overcollectedPaise)}.</p>}
          {user.role === "ADMIN" && exception.version ? <form action={reviewPaymentExceptionAction} className={styles.form}>
            <input type="hidden" name="caseId" value={item.id} />
            <input type="hidden" name="exceptionVersion" value={exception.version} />
            <label>Resolution notes<textarea name="resolutionNote" required minLength={MIN_RESOLUTION_NOTE} maxLength={MAX_RESOLUTION_NOTE}
              placeholder="What you checked (for example in Razorpay) and how it was resolved" /></label>
            <p>{REVIEW_DISCLAIMER} Overcollection, a missing balance and every other issuance rule still apply after the review.</p>
            <button type="submit">Mark reviewed / resolved</button>
          </form> : <p>An ADMIN must review this exception before a new Payment Link can be issued.</p>}
        </> : <p>All recorded payment exceptions on this case have been reviewed. Issuance still follows the financial position and the normal rules.</p>}
        {exception.reviews.length > 0 && <div className={styles.tableWrap}>
          <h4>Review history</h4>
          <table>
            <thead><tr><th>Reviewed</th><th>By</th><th>Resolution notes</th><th>Exception reviewed</th></tr></thead>
            <tbody>{exception.reviews.map((review) => <tr key={review.id}>
              <td>{new Date(review.createdAt).toLocaleString("en-IN")}</td>
              <td>{review.reviewedByStaff?.fullName ?? "Admin"}</td>
              <td>{review.resolutionNote}</td>
              <td>{review.valid ? review.coveredNote || "(no new text)" : "Does not match the current exception record"}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>}
      {user.role === "ADMIN" && <section className={styles.panel}>
        <h3>{currentRevision ? "Approve a revised scope" : "Approve inspected scope"}</h3>
        <p>A revision replaces the approved amount. Open links are hidden and must be cancelled or reconciled before a new one is issued.</p>
        {packages.length ? <form action={approveRevisionAction} className={styles.form}>
          <input type="hidden" name="caseId" value={item.id} />
          <label>Package<select name="packageCode" required defaultValue={currentRevision?.packageCode ?? ""}>
            <option value="" disabled>Choose a package</option>
            {packages.map((option) => <option key={option.id} value={option.code}>{option.name} ({option.code})</option>)}
          </select></label>
          <label>Bathrooms<input name="bathroomsCount" type="number" min="1" max="100" required defaultValue={currentRevision?.bathroomsCount ?? 1} /></label>
          <label>Approved amount (₹)<input name="amountRupees" type="number" min="0.01" step="0.01" required defaultValue={currentRevision ? (currentRevision.approvedAmountPaise / 100).toFixed(2) : undefined} /></label>
          {currentRevision && <label>Reason for revision<textarea name="reason" required maxLength={1000} /></label>}
          <button type="submit">Approve commercial revision</button>
        </form> : <p>No active package is available for {item.city ?? "the unverified city"}.</p>}
      </section>}
      <section className={styles.panel}>
        <h3>Razorpay Payment Links</h3>
        <p>Only a case with verified Goa location evidence and an outstanding balance can receive a new link, one live link at a time. Issuing a link is a request for payment, not a payment received. Share the link after checking the amount below.</p>
        {issuanceMessage && <div className={styles.notice} role="status">{issuanceMessage}{user.role === "ADMIN" && issuance.problems.length > 0 && <> Configuration: {issuance.problems.join(", ")}.</>}</div>}
        {item.balance && item.balance.outstandingPaise <= 0 && <p>No balance is currently due, so no new Payment Link can be issued.</p>}
        {canIssue && (!issuance.enabled
          ? <button type="button" disabled aria-disabled="true">Create link for {rupees(item.balance!.outstandingPaise)} (issuance not enabled)</button>
          : user.role === "ADMIN"
            ? <form action={createPaymentLinkAction} className={styles.form}>
              <input type="hidden" name="caseId" value={item.id} />
              <label>Link amount (₹)<input name="amountRupees" type="number" min="0.01" step="0.01" max={rupeeInputValue(item.balance!.outstandingPaise)}
                required defaultValue={rupeeInputValue(item.balance!.outstandingPaise)} /></label>
              <p>Defaults to the full outstanding balance of {rupees(item.balance!.outstandingPaise)}. Enter a smaller amount only when the customer is deliberately paying in parts; the rest stays outstanding.</p>
              <button type="submit">Create Payment Link</button>
            </form>
            : <form action={createPaymentLinkAction}><input type="hidden" name="caseId" value={item.id} /><button type="submit">Create link for the full outstanding {rupees(item.balance!.outstandingPaise)}</button></form>)}
        {active && <p className={styles.linkCallout}>Active link for {rupees(active.amountPaise)}: <a href={active.url!} target="_blank" rel="noopener noreferrer">Open Razorpay link</a></p>}
        {item.order?.paymentRequests.length ? <div className={styles.tableWrap}><table><thead><tr><th>Created</th><th>Amount</th><th>Status</th><th>Provider ID</th><th>Actions</th></tr></thead><tbody>
          {item.order.paymentRequests.map((request) => <tr key={request.id}>
            <td>{new Date(request.createdAt).toLocaleString("en-IN")}</td><td>{rupees(request.amountPaise)}</td><td>{request.status} {request.providerStatus && `(${request.providerStatus})`}{request.providerError && <><br /><small>Razorpay: {request.providerError}</small></>}</td><td>{request.providerLinkId ?? "—"}</td>
            <td>{user.role === "ADMIN" && <div className={styles.inlineActions}>
              <form action={reconcilePaymentLinkAction}><input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="requestId" value={request.id} /><button type="submit">Reconcile</button></form>
              {["ACTIVE", "CANCEL_PENDING"].includes(request.status) && <form action={cancelPaymentLinkAction}><input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="requestId" value={request.id} /><button type="submit">Cancel</button></form>}
            </div>}</td>
          </tr>)}
        </tbody></table></div> : <p>No Payment Links created.</p>}
      </section>
      {user.role === "ADMIN" && item.order && <section className={styles.panel}>
        <h3>Record an offline collection</h3>
        <p>Record only money received and independently verified. UPI and POS need the full transaction reference; the same reference cannot be recorded twice unless the earlier entry is reversed.</p>
        <form action={recordOfflineCollectionAction} className={styles.form}>
          <input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <label>Received amount (₹)<input name="amountRupees" type="number" min="0.01" step="0.01" required /></label>
          <label>Method<select name="method"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="POS">POS</option></select></label>
          <label>Reference<input name="externalReference" maxLength={160} placeholder="UPI UTR/RRN, or POS RRN from the charge slip (not the approval code)" /></label>
          <label>Audit note<textarea name="note" maxLength={1000} /></label>
          <button type="submit">Record verified collection</button>
        </form>
      </section>}
      <section className={styles.panel}>
        <h3>Collection ledger</h3>
        {item.order?.payments.length ? <div className={styles.tableWrap}><table><thead><tr><th>When</th><th>Type</th><th>Amount</th><th>Reference</th><th>Note / correction</th></tr></thead><tbody>
          {item.order.payments.map((payment) => <tr key={payment.id}>
            <td>{new Date(payment.collectedAt ?? payment.createdAt).toLocaleString("en-IN")}</td>
            <td>{payment.source === "LEGACY" ? "Legacy (unverified provenance, not counted)" : `${payment.source} ${payment.recordType.toLowerCase()}`}</td><td>{payment.recordType === "REVERSAL" ? "−" : ""}{rupees(payment.amountPaise)}</td>
            <td>{payment.providerPaymentId ?? payment.externalTxnRef ?? "—"}</td>
            <td>{payment.note ?? "—"}{user.role === "ADMIN" && payment.source === "OFFLINE" && payment.recordType === "COLLECTION" && !reversedIds.has(payment.id) && <form action={reverseOfflineCollectionAction} className={styles.inlineActions}>
              <input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="paymentId" value={payment.id} />
              <input name="reason" minLength={5} maxLength={1000} required placeholder="Correction reason" aria-label="Correction reason" />
              <button type="submit">Reverse entry</button>
            </form>}</td>
          </tr>)}
        </tbody></table></div> : <p>No collection recorded.</p>}
      </section>
    </div>
  </CrmShell>;
}
