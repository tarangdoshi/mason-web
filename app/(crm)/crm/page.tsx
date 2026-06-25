import { apiFetch } from "../../../lib/api";
import { getCrmSessionToken, requireCrmUser } from "../../../lib/crm";
import CrmShell from "./crm-shell";
import DashboardView from "./dashboard-view";
import type { DashboardSummaryResponse, LeadListResponse, StaffListResponse } from "./types";

type SearchParams = {
  status?: string | string[];
  channel?: string | string[];
  type?: string | string[];
  assignedStaffId?: string | string[];
  city?: string | string[];
  search?: string | string[];
  compose?: string | string[];
};

function pickValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CrmDashboardPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const user = await requireCrmUser();
  const token = await getCrmSessionToken();
  const params = (await searchParams) ?? {};
  const filters = new URLSearchParams();

  const initialFilters = {
    status: pickValue(params.status),
    channel: pickValue(params.channel),
    type: pickValue(params.type),
    assignedStaffId: pickValue(params.assignedStaffId),
    city: pickValue(params.city),
    search: pickValue(params.search)
  };
  const compose = pickValue(params.compose);

  for (const [key, value] of Object.entries(initialFilters)) {
    if (value) {
      filters.set(key, value);
    }
  }

  const query = filters.toString();
  const [summary, leads, staff] = await Promise.all([
    apiFetch<DashboardSummaryResponse>("/api/v1/internal/dashboard/summary", { token: token ?? undefined }),
    apiFetch<LeadListResponse>(`/api/v1/internal/leads${query ? `?${query}` : ""}`, { token: token ?? undefined }),
    apiFetch<StaffListResponse>("/api/v1/internal/staff", { token: token ?? undefined })
  ]);

  return (
    <CrmShell
      user={user}
      title="Launch overview"
      subtitle="One queue for inbound demand, early-stage booking requests, and support follow-up."
    >
      <DashboardView
        user={user}
        summary={summary.data}
        leads={leads.data}
        staff={staff.data}
        initialFilters={initialFilters}
        openLeadComposer={compose === "new-lead"}
      />
    </CrmShell>
  );
}
