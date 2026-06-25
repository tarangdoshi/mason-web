"use client";

import { Button, Card, Form, Input, Select, Space, Tag, Typography } from "antd";
import { useRouter } from "next/navigation";
import type { StaffUser } from "../../../lib/crm";
import type { LeadDetailResponse, StaffListResponse } from "./types";
import { formatDateTime, formatPackageDisplay, formatRelativeTime, humanizeToken, leadPriorityOptions, leadStatusOptions } from "./types";
import styles from "./crm.module.css";
import { useCrmToast } from "./use-crm-toast";

const { Paragraph, Text, Title } = Typography;

function statusColor(status: string) {
  switch (status) {
    case "NEW":
      return styles.statusNew;
    case "CONTACTED":
      return styles.statusContacted;
    case "QUALIFIED":
      return styles.statusQualified;
    case "BOOKED":
      return styles.statusBooked;
    case "RESOLVED":
      return styles.statusResolved;
    case "LOST":
      return styles.statusLost;
    default:
      return styles.statusNew;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatMetadataLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatMetadataValue(item)).join(", ");
  }

  return JSON.stringify(value);
}

function MetadataTree({ value }: { value: unknown }) {
  if (isRecord(value)) {
    return (
      <div className={styles.metadataGroup}>
        {Object.entries(value).map(([key, nestedValue]) => (
          <div key={key} className={styles.metadataNode}>
            <span className={styles.summaryLabel}>{formatMetadataLabel(key)}</span>
            {isRecord(nestedValue) ? (
              <div className={styles.metadataNested}>
                <MetadataTree value={nestedValue} />
              </div>
            ) : (
              <span className={styles.summaryValue}>{formatMetadataValue(nestedValue)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return <span className={styles.summaryValue}>{formatMetadataValue(value)}</span>;
}

export default function LeadDetailView({
  user,
  lead,
  staff
}: {
  user: StaffUser;
  lead: LeadDetailResponse["data"];
  staff: StaffListResponse["data"];
}) {
  const router = useRouter();
  const toast = useCrmToast();
  const [leadForm] = Form.useForm();
  const [assignmentForm] = Form.useForm();
  const [noteForm] = Form.useForm();
  const [callForm] = Form.useForm();

  async function patchLead(values: Record<string, string | null>) {
    const response = await fetch(`/crm/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(values)
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      toast.error("Lead update failed", payload?.error || "Unable to update lead.");
      return false;
    }

    router.refresh();
    return true;
  }

  async function addActivity(activityType: "NOTE" | "CALL_LOGGED", body: string) {
    const response = await fetch(`/crm/api/leads/${lead.id}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ activityType, body })
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      toast.error("Activity update failed", payload?.error || "Unable to add activity.");
      return false;
    }

    router.refresh();
    return true;
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card bordered={false} className={styles.heroCard}>
        <div className={styles.heroGrid}>
          <Space direction="vertical" size={16}>
            <Space wrap>
              <span className={`${styles.statusChip} ${statusColor(lead.status)}`}>{humanizeToken(lead.status)}</span>
              <Tag className={styles.pill}>{humanizeToken(lead.type)}</Tag>
              <Tag className={styles.pill}>{humanizeToken(lead.channel)}</Tag>
            </Space>
            <Title className={styles.heroHeadline} style={{ fontSize: "clamp(2rem, 2.7vw, 3rem)" }}>
              {lead.customerName}
            </Title>
            <Paragraph className={styles.heroDescription}>
              {lead.notesSummary || "This lead does not yet have a summary note. Add context so the next handoff is clear."}
            </Paragraph>
          </Space>

          <div className={styles.heroMiniGrid}>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Owner</span>
              <span className={styles.miniValue} style={{ fontSize: "1.6rem" }}>
                {lead.assignedStaff?.fullName || "Unassigned"}
              </span>
              <span className={styles.miniText}>Current case owner for the next follow-up.</span>
            </div>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Last touched</span>
              <span className={styles.miniValue} style={{ fontSize: "1.6rem" }}>
                {formatRelativeTime(lead.updatedAt)}
              </span>
              <span className={styles.miniText}>Updated {formatDateTime(lead.updatedAt)}.</span>
            </div>
          </div>
        </div>
      </Card>

      <div className={styles.detailGrid}>
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Case summary</h3>
                <p className={styles.sectionSubtitle}>Contact, location, package interest, and source detail in one view.</p>
              </div>
            </div>

            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Phone</span>
                <span className={styles.summaryValue}>{lead.phoneE164}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Priority</span>
                <span className={styles.summaryValue}>{humanizeToken(lead.priority)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>City</span>
                <span className={styles.summaryValue}>{lead.city || "Outside service area"}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Package</span>
                <span className={styles.summaryValue}>{formatPackageDisplay(lead.packageCode)}</span>
                {lead.packageCode ? <span className={styles.mutedText}>{lead.packageCode}</span> : null}
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Callback</span>
                <span className={styles.summaryValue}>{formatDateTime(lead.preferredCallbackAt)}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Created</span>
                <span className={styles.summaryValue}>{formatDateTime(lead.createdAt)}</span>
              </div>
              <div className={styles.summaryItem} style={{ gridColumn: "1 / -1" }}>
                <span className={styles.summaryLabel}>Location</span>
                <span className={styles.summaryValue}>{lead.locationText}</span>
              </div>
            </div>
          </Card>

          {lead.metadataJson ? (
            <Card bordered={false} className={styles.surfaceCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Captured metadata</h3>
                  <p className={styles.sectionSubtitle}>Structured context collected from forms, checkout, or manual entry.</p>
                </div>
              </div>
              <div className={styles.summaryList}>
                {Object.entries(lead.metadataJson).map(([key, value]) => (
                  <div key={key} className={styles.summaryItem}>
                    <span className={styles.summaryLabel}>{formatMetadataLabel(key)}</span>
                    <MetadataTree value={value} />
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Activity timeline</h3>
                <p className={styles.sectionSubtitle}>Notes, calls, and status movement in chronological order.</p>
              </div>
            </div>

            <div className={styles.timelineList}>
              {lead.activities.map((item) => (
                <div key={item.id} className={styles.timelineItem}>
                  <span className={styles.timelineMeta}>
                    {humanizeToken(item.activityType)} · {item.staffUser?.fullName || "System"} · {formatDateTime(item.createdAt)}
                  </span>
                  <span className={styles.timelineBody}>{item.body}</span>
                </div>
              ))}
            </div>
          </Card>
        </Space>

        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Lead updates</h3>
                <p className={styles.sectionSubtitle}>Adjust stage, urgency, and the summary used in future handoff.</p>
              </div>
            </div>

            <Form
              form={leadForm}
              layout="vertical"
              initialValues={{
                status: lead.status,
                priority: lead.priority,
                notesSummary: lead.notesSummary || ""
              }}
              onFinish={async (values) => {
                const ok = await patchLead(values);
                if (ok) {
                  toast.success("Lead updated", "Status, priority, and summary were saved.");
                }
              }}
            >
              <Form.Item label="Status" name="status" rules={[{ required: true }]}>
                <Select options={leadStatusOptions.map((value) => ({ value, label: humanizeToken(value) }))} />
              </Form.Item>
              <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
                <Select options={leadPriorityOptions.map((value) => ({ value, label: humanizeToken(value) }))} />
              </Form.Item>
              <Form.Item label="Summary note" name="notesSummary">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                Save lead updates
              </Button>
            </Form>
          </Card>

          {user.role === "ADMIN" ? (
            <Card bordered={false} className={styles.surfaceCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Assignment</h3>
                  <p className={styles.sectionSubtitle}>Move ownership cleanly when this conversation needs a new handler.</p>
                </div>
              </div>
              <Form
                form={assignmentForm}
                layout="vertical"
                initialValues={{ assignedStaffId: lead.assignedStaff?.id || undefined }}
                onFinish={async (values) => {
                  const ok = await patchLead({ assignedStaffId: values.assignedStaffId || null });
                  if (ok) {
                    toast.success("Owner updated", "The lead has been reassigned.");
                  }
                }}
              >
                <Form.Item label="Assign owner" name="assignedStaffId">
                  <Select allowClear options={staff.map((member) => ({ value: member.id, label: member.fullName }))} />
                </Form.Item>
                <Button htmlType="submit">Update owner</Button>
              </Form>
            </Card>
          ) : null}

          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Add note</h3>
                <p className={styles.sectionSubtitle}>Capture nuance before the next call or visit.</p>
              </div>
            </div>
            <Form
              form={noteForm}
              layout="vertical"
              onFinish={async (values) => {
                const ok = await addActivity("NOTE", values.body);
                if (ok) {
                  toast.success("Note added", "The timeline now includes your note.");
                  noteForm.resetFields();
                }
              }}
            >
              <Form.Item label="Note" name="body" rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder="Add context for the next follow-up." />
              </Form.Item>
              <Button htmlType="submit">Add note</Button>
            </Form>
          </Card>

          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Log call</h3>
                <p className={styles.sectionSubtitle}>Record the outcome and promised next action.</p>
              </div>
            </div>
            <Form
              form={callForm}
              layout="vertical"
              onFinish={async (values) => {
                const ok = await addActivity("CALL_LOGGED", values.body);
                if (ok) {
                  toast.success("Call logged", "The latest conversation has been captured.");
                  callForm.resetFields();
                }
              }}
            >
              <Form.Item label="Call outcome" name="body" rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder="Outcome, objection, next step, or promised callback." />
              </Form.Item>
              <Button htmlType="submit">Log call</Button>
            </Form>
          </Card>
        </Space>
      </div>
    </Space>
  );
}
