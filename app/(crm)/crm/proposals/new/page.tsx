import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireCrmUser } from "../../../../../lib/crm";
import { proposalsEnabled } from "../../../../../lib/proposals/flag";
import CrmShell from "../../crm-shell";
import ProposalBuilder from "./proposal-builder";

export const metadata: Metadata = { title: "New proposal", robots: { index: false, follow: false } };

export default async function NewProposalPage({ searchParams }: { searchParams?: Promise<{ zohoLeadId?: string }> }) {
  if (!proposalsEnabled()) notFound();
  const user = await requireCrmUser();
  const { zohoLeadId } = (await searchParams) ?? {};
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return (
    <CrmShell user={user} title="New proposal" subtitle="Record the assessment, then share Essential and Essential + Add-on options.">
      <ProposalBuilder
        isAdmin={user.role === "ADMIN"}
        initialZohoLeadId={zohoLeadId && /^\d{5,30}$/.test(zohoLeadId) ? zohoLeadId : ""}
        today={today}
      />
    </CrmShell>
  );
}
