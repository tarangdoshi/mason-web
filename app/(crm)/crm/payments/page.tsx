import Link from "next/link";
import { apiFetch } from "../../../../lib/api";
import { getCrmSessionToken, requireCrmUser } from "../../../../lib/crm";
import CrmShell from "../crm-shell";
import { startCommercialCaseAction } from "./actions";
import { rupees, type CommercialCase } from "./types";
import styles from "./payments.module.css";

export default async function PaymentsPage({ searchParams }: { searchParams?: Promise<{ leadRecordId?: string; error?: string }> }) {
  const user = await requireCrmUser();
  const token = await getCrmSessionToken();
  const { leadRecordId, error } = (await searchParams) ?? {};
  const response = await apiFetch<{ data: CommercialCase[] }>("/api/v1/internal/commercial-cases", { token: token ?? undefined });

  return <CrmShell user={user} title="Commercial payments" subtitle="Approve the inspected scope, then collect against the approved balance.">
    <div className={styles.stack}>
      {error && <div className={styles.error} role="alert">{error}</div>}
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
        {response.data.length === 0 ? <p>No commercial cases are assigned to you yet.</p> : <div className={styles.tableWrap}><table>
          <thead><tr><th>Customer</th><th>Origin</th><th>Location</th><th>Payment state</th><th>Balance</th><th>Updated</th></tr></thead>
          <tbody>{response.data.map((item) => <tr key={item.id}>
            <td><Link href={`/crm/payments/${item.id}`}>{item.customerName}</Link></td>
            <td>{item.origin === "ZOHO_LEAD" ? "Zoho" : "Mason"}</td>
            <td>{item.verifiedLocationMarket === "GOA" && item.city === "Goa" ? "Goa (verified)" : item.verifiedLocationMarket ? `${item.verifiedLocationMarket} (verified)` : `${item.city ?? "Unknown"} · location unverified`}</td>
            <td>{item.exceptionNote ? "Exception" : item.balance?.paymentState.replaceAll("_", " ") ?? "Awaiting approval"}</td>
            <td>{item.balance ? rupees(item.balance.balancePaise) : "—"}</td>
            <td>{new Date(item.updatedAt).toLocaleDateString("en-IN")}</td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </div>
  </CrmShell>;
}
