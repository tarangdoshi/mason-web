import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, apiFetch } from "../../../../../lib/api";
import { getCrmSessionToken, requireCrmUser } from "../../../../../lib/crm";
import CrmShell from "../../crm-shell";
import { approveRevisionAction, cancelPaymentLinkAction, createPaymentLinkAction, reconcilePaymentLinkAction, recordOfflineCollectionAction, reverseOfflineCollectionAction } from "../actions";
import { rupees, type CommercialCase } from "../types";
import styles from "../payments.module.css";

type PackageOption = { id: string; code: string; name: string; city: string; active: boolean };

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
  const currentRevision = item.revisions.find((revision) => revision.id === item.order?.currentRevisionId);
  const active = item.order?.paymentRequests.find((request) => request.status === "ACTIVE" && request.url);
  const canIssue = item.city === "Goa" && !!currentRevision && !!item.balance && item.balance.balancePaise > 0 && !item.exceptionNote &&
    !item.order?.paymentRequests.some((request) => ["ACTIVE", "PREPARING", "CANCEL_PENDING"].includes(request.status));
  const reversedIds = new Set(item.order?.payments.filter((payment) => payment.recordType === "REVERSAL").map((payment) => payment.reversesPaymentId) ?? []);

  return <CrmShell user={user} title={item.customerName} subtitle={`${item.origin === "ZOHO_LEAD" ? "Zoho Lead" : "Mason lead"} · ${item.city ?? "City unverified"} · ${item.order?.orderNumber ?? "Awaiting commercial approval"}`}>
    <div className={styles.stack}>
      <Link href="/crm/payments">← All commercial cases</Link>
      {feedback.error && <div className={styles.error} role="alert">{feedback.error}</div>}
      {feedback.message && <div className={styles.notice} role="status">{feedback.message}</div>}
      {item.exceptionNote && <div className={styles.error} role="alert"><strong>Payment exception — stop sharing links.</strong> {item.exceptionNote}</div>}
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
        <h3>Approved amount and collections</h3>
        {item.balance ? <div className={styles.metrics}>
          <div><span>Approved</span><strong>{rupees(item.balance.approvedAmountPaise)}</strong></div>
          <div><span>Collected</span><strong>{rupees(item.balance.collectedPaise)}</strong></div>
          <div><span>Balance</span><strong>{rupees(item.balance.balancePaise)}</strong></div>
          <div><span>State</span><strong>{item.balance.paymentState.replaceAll("_", " ")}</strong></div>
        </div> : <p>No amount has been approved. Public package prices and browser totals are not payment authority.</p>}
        {currentRevision && <p>Revision {currentRevision.revisionNumber}: {currentRevision.packageName} · {currentRevision.bathroomsCount} bathroom(s), approved {new Date(currentRevision.approvedAt).toLocaleString("en-IN")}.</p>}
      </section>
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
        <p>Only a verified Goa case with an approved outstanding balance can receive a new link. Share the link after checking the amount below.</p>
        {canIssue && <form action={createPaymentLinkAction}><input type="hidden" name="caseId" value={item.id} /><button type="submit">Create link for {rupees(item.balance!.balancePaise)}</button></form>}
        {active && <p className={styles.linkCallout}>Active link for {rupees(active.amountPaise)}: <a href={active.url!} target="_blank" rel="noopener noreferrer">Open Razorpay link</a></p>}
        {item.order?.paymentRequests.length ? <div className={styles.tableWrap}><table><thead><tr><th>Created</th><th>Amount</th><th>Status</th><th>Provider ID</th><th>Actions</th></tr></thead><tbody>
          {item.order.paymentRequests.map((request) => <tr key={request.id}>
            <td>{new Date(request.createdAt).toLocaleString("en-IN")}</td><td>{rupees(request.amountPaise)}</td><td>{request.status} {request.providerStatus && `(${request.providerStatus})`}</td><td>{request.providerLinkId ?? "—"}</td>
            <td>{user.role === "ADMIN" && <div className={styles.inlineActions}>
              <form action={reconcilePaymentLinkAction}><input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="requestId" value={request.id} /><button type="submit">Reconcile</button></form>
              {["ACTIVE", "CANCEL_PENDING"].includes(request.status) && <form action={cancelPaymentLinkAction}><input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="requestId" value={request.id} /><button type="submit">Cancel</button></form>}
            </div>}</td>
          </tr>)}
        </tbody></table></div> : <p>No Payment Links created.</p>}
      </section>
      {user.role === "ADMIN" && item.order && <section className={styles.panel}>
        <h3>Record an offline collection</h3>
        <p>Record only money received and independently verified. Keep a reference for UPI or POS. Each submission carries a unique idempotency key.</p>
        <form action={recordOfflineCollectionAction} className={styles.form}>
          <input type="hidden" name="caseId" value={item.id} /><input type="hidden" name="idempotencyKey" value={randomUUID()} />
          <label>Received amount (₹)<input name="amountRupees" type="number" min="0.01" step="0.01" required /></label>
          <label>Method<select name="method"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="POS">POS</option></select></label>
          <label>Reference<input name="externalReference" maxLength={160} placeholder="Receipt, UTR or terminal reference" /></label>
          <label>Audit note<textarea name="note" maxLength={1000} /></label>
          <button type="submit">Record verified collection</button>
        </form>
      </section>}
      <section className={styles.panel}>
        <h3>Collection ledger</h3>
        {item.order?.payments.length ? <div className={styles.tableWrap}><table><thead><tr><th>When</th><th>Type</th><th>Amount</th><th>Reference</th><th>Note / correction</th></tr></thead><tbody>
          {item.order.payments.map((payment) => <tr key={payment.id}>
            <td>{new Date(payment.collectedAt ?? payment.createdAt).toLocaleString("en-IN")}</td>
            <td>{payment.source} {payment.recordType.toLowerCase()}</td><td>{payment.recordType === "REVERSAL" ? "−" : ""}{rupees(payment.amountPaise)}</td>
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
