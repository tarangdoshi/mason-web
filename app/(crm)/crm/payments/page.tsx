import Link from "next/link";
import { ApiError, apiFetch } from "../../../../lib/api";
import { getCrmSessionToken, requireCrmUser } from "../../../../lib/crm";
import { issuanceNotice, PAYMENT_STATUS_PATH, readPaymentIssuance } from "../../../../lib/payment-issuance";
import { paymentStateLabel } from "../../../../lib/payment-collections";
import { exceptionListLabel, exceptionReviewOf } from "../../../../lib/payment-exception-review";
import CrmShell from "../crm-shell";
import { startCommercialCaseAction } from "./actions";
import { rupees, type CommercialCase } from "./types";
import styles from "./payments.module.css";

export default async function PaymentsPage({ searchParams }: { searchParams?: Promise<{ leadRecordId?: string; error?: string }> }) {
  const user = await requireCrmUser();
  const token = await getCrmSessionToken();
  const { leadRecordId, error } = (await searchParams) ?? {};
  let cases: CommercialCase[] | null = null;
  let loadError: string | null = null;
  try {
    cases = (await apiFetch<{ data: CommercialCase[] }>("/api/v1/internal/commercial-cases", { token: token ?? undefined })).data;
  } catch (failure) {
    // The payments service may be unavailable or not yet migrated; show that instead of failing the page.
    loadError = failure instanceof ApiError ? failure.message : "The payments service could not be reached.";
  }
  const issuanceMessage = issuanceNotice(await readPaymentIssuance(() => apiFetch(PAYMENT_STATUS_PATH, { token: token ?? undefined })));

  return <CrmShell user={user} title="Commercial payments" subtitle="Approve the inspected scope, then collect against the approved balance.">
    <div className={styles.stack}>
      {error && <div className={styles.error} role="alert">{error}</div>}
      {issuanceMessage && <div className={styles.notice} role="status">{issuanceMessage}</div>}
      <section className={styles.panel}>
        <h3>Open a commercial case</h3>
        <p>Begin only after the customer and inspection details have been checked. An assessment request alone does not confirm an inspection appointment.</p>
        <div className={styles.twoColumns}>
          <form action={startCommercialCaseAction} className={styles.form}>
            <input type="hidden" name="origin" value="MASON_LEAD" />
            <label>Mason lead ID<input name="leadRecordId" required defaultValue={leadRecordId ?? ""} placeholder="Lead UUID" /></label>
            <button type="submit">Open Mason lead case</button>
          </form>
          {user.role === "ADMIN" && <form action={startCommercialCaseAction} className={styles.form}>
            <input type="hidden" name="origin" value="ZOHO_LEAD" />
            <label>Zoho Lead ID<input name="zohoLeadId" required pattern="[0-9]{5,30}" placeholder="Zoho Lead ID" /></label>
            <button type="submit">Open Zoho lead case</button>
          </form>}
        </div>
      </section>
      <section className={styles.panel}>
        <h3>Commercial cases</h3>
        {loadError ? <div className={styles.error} role="alert">Commercial cases could not be loaded: {loadError}</div>
          : !cases || cases.length === 0 ? <p>No commercial cases are assigned to you yet.</p> : <div className={styles.tableWrap}><table>
          <thead><tr><th>Customer</th><th>Origin</th><th>Location</th><th>Payment state</th><th>Outstanding</th><th>Updated</th></tr></thead>
          <tbody>{cases.map((item) => <tr key={item.id}>
            <td><Link href={`/crm/payments/${item.id}`}>{item.customerName}</Link></td>
            <td>{item.origin === "ZOHO_LEAD" ? "Zoho" : "Mason"}</td>
            <td>{item.verifiedLocationMarket === "GOA" && item.city === "Goa" ? "Goa (verified)" : item.verifiedLocationMarket ? `${item.verifiedLocationMarket} (verified)` : `${item.city ?? "Unknown"} · location unverified`}</td>
            <td>{exceptionListLabel(exceptionReviewOf(item).status) ?? paymentStateLabel(item.balance?.paymentState)}</td>
            <td>{item.balance ? <>{rupees(item.balance.outstandingPaise)}{item.balance.overcollectedPaise > 0 && <> · overcollected {rupees(item.balance.overcollectedPaise)}</>}</> : "—"}</td>
            <td>{new Date(item.updatedAt).toLocaleDateString("en-IN")}</td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </div>
  </CrmShell>;
}
