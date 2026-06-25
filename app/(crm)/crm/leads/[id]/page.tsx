import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "../../../../../lib/api";
import { getCrmSessionToken, requireCrmUser } from "../../../../../lib/crm";
import CrmShell from "../../crm-shell";
import LeadDetailView from "../../lead-detail-view";
import type { LeadDetailResponse, StaffListResponse } from "../../types";
import { humanizeToken } from "../../types";

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCrmUser();
  const token = await getCrmSessionToken();
  const { id } = await params;

  let lead: LeadDetailResponse["data"];
  try {
    const response = await apiFetch<LeadDetailResponse>(`/api/v1/internal/leads/${id}`, {
      token: token ?? undefined
    });
    lead = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  const staff = await apiFetch<StaffListResponse>("/api/v1/internal/staff", {
    token: token ?? undefined
  });

  return (
    <CrmShell
      user={user}
      title={lead.customerName}
      subtitle={`${humanizeToken(lead.type)} · ${humanizeToken(lead.channel)} · ${humanizeToken(lead.status)}`}
    >
      <LeadDetailView user={user} lead={lead} staff={staff.data} />
    </CrmShell>
  );
}
