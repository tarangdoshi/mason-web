import type { StaffUser } from "../../../lib/crm";
import { formatPackageLabel } from "../../../lib/crm-contract";

export type DashboardSummaryResponse = {
  data: {
    kpis: {
      totalReceivedToday: number;
      openLeads: number;
      bookedLeads: number;
      resolvedLeads: number;
      unassignedLeads: number;
    };
    statusBreakdown: Array<{ status: string; count: number }>;
    channelBreakdown: Array<{ channel: string; count: number }>;
    agentWorkload: Array<StaffUser & { openLeadCount: number }>;
    recentActivities: Array<{
      id: string;
      activityType: string;
      body: string;
      createdAt: string;
      staffUser: StaffUser | null;
      leadRecord: {
        id: string;
        customerName: string;
        status: string;
        type: string;
        channel: string;
      };
    }>;
    outboxHealth: OutboxHealth;
  };
};

export type OutboxHealth = {
  counts: {
    PENDING: number;
    PROCESSING: number;
    FAILED: number;
    DEAD: number;
    SUCCEEDED: number;
  };
  queue: {
    activeBacklog: number;
    dueNow: number;
    deadLetterCount: number;
    oldestPendingAt: string | null;
  };
  recentFailures: Array<{
    id: string;
    aggregateId: string;
    status: "FAILED" | "DEAD";
    attempts: number;
    lastError: string | null;
    nextAttemptAt: string;
    updatedAt: string;
  }>;
};

export type StaffListResponse = {
  data: StaffUser[];
};

export type LeadListItem = {
  id: string;
  type: string;
  channel: string;
  status: string;
  priority: string;
  customerName: string;
  phoneE164: string;
  city: string | null;
  locationText: string;
  packageCode: string | null;
  preferredCallbackAt: string | null;
  notesSummary: string | null;
  updatedAt: string;
  assignedStaff: StaffUser | null;
};

export type LeadListResponse = {
  data: LeadListItem[];
};

export type LeadDetailResponse = {
  data: LeadListItem & {
    metadataJson: Record<string, unknown> | null;
    createdAt: string;
    assignedStaff: StaffUser | null;
    activities: Array<{
      id: string;
      activityType: string;
      body: string;
      createdAt: string;
      staffUser: StaffUser | null;
    }>;
  };
};

export const leadStatusOptions = ["NEW", "CONTACTED", "QUALIFIED", "BOOKED", "RESOLVED", "LOST"];
export const leadChannelOptions = ["PHONE", "WHATSAPP", "WEBSITE_FORM", "WEBSITE_CHECKOUT", "MANUAL"];
export const leadTypeOptions = ["ENQUIRY", "BOOKING_REQUEST", "SUPPORT"];
export const leadPriorityOptions = ["LOW", "MEDIUM", "HIGH"];

export function formatDateTime(value: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | null) {
  if (!value) {
    return "No recent activity";
  }

  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

export function humanizeToken(value: string) {
  return value.replaceAll("_", " ");
}

export function formatPackageDisplay(packageCode: string | null) {
  return formatPackageLabel(packageCode) || "Not linked yet";
}
