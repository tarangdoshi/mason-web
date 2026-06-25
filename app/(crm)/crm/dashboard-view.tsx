"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs, { type Dayjs } from "dayjs";
import {
  CheckCircleOutlined,
  CompassOutlined,
  InboxOutlined,
  PhoneOutlined,
  PlusOutlined,
  TeamOutlined
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Typography
} from "antd";
import type { StaffUser } from "../../../lib/crm";
import type { DashboardSummaryResponse, LeadListItem, StaffListResponse } from "./types";
import {
  formatDateTime,
  formatPackageDisplay,
  formatRelativeTime,
  humanizeToken,
  leadChannelOptions,
  leadPriorityOptions,
  leadStatusOptions,
  leadTypeOptions
} from "./types";
import styles from "./crm.module.css";
import { useCrmToast } from "./use-crm-toast";

const { Paragraph, Text, Title } = Typography;

const CITY_OPTIONS = ["Mumbai", "Goa"] as const;

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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function DashboardView({
  user,
  summary,
  leads,
  staff,
  initialFilters,
  openLeadComposer
}: {
  user: StaffUser;
  summary: DashboardSummaryResponse["data"];
  leads: LeadListItem[];
  staff: StaffListResponse["data"];
  initialFilters: {
    search?: string;
    status?: string;
    channel?: string;
    type?: string;
    city?: string;
    assignedStaffId?: string;
  };
  openLeadComposer: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useCrmToast();
  const [createForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  const visibleLeadCount = leads.length;
  const activeFilterCount = Object.values(initialFilters).filter(Boolean).length;
  const newLeads = leads.filter((lead) => lead.status === "NEW");
  const unassignedLeads = leads.filter((lead) => !lead.assignedStaff);
  const highPriorityLeads = leads.filter((lead) => lead.priority === "HIGH");
  const callbackDueLeads = leads
    .filter((lead) => lead.preferredCallbackAt)
    .sort((left, right) => new Date(left.preferredCallbackAt ?? 0).getTime() - new Date(right.preferredCallbackAt ?? 0).getTime())
    .slice(0, 3);
  const attentionLeads = [...highPriorityLeads, ...newLeads.filter((lead) => lead.priority !== "HIGH"), ...unassignedLeads]
    .filter((lead, index, collection) => collection.findIndex((item) => item.id === lead.id) === index)
    .slice(0, 4);
  const cityPulse = CITY_OPTIONS.map((city) => {
    const cityLeads = leads.filter((lead) => lead.city === city);
    const bookedCount = cityLeads.filter((lead) => lead.status === "BOOKED").length;

    return {
      city,
      count: cityLeads.length,
      bookedCount,
      share: visibleLeadCount ? Math.round((cityLeads.length / visibleLeadCount) * 100) : 0
    };
  });
  const topOwner = [...summary.agentWorkload].sort((left, right) => right.openLeadCount - left.openLeadCount)[0] ?? null;
  const syncHealth = summary.outboxHealth;

  const kpiCards = [
    {
      key: "portfolio",
      label: "Total leads",
      value: visibleLeadCount,
      icon: <TeamOutlined />,
      meta: `${summary.kpis.openLeads} active follow-ups`,
      fill: Math.max(18, Math.min(100, visibleLeadCount * 12))
    },
    {
      key: "new",
      label: "Received today",
      value: summary.kpis.totalReceivedToday,
      icon: <InboxOutlined />,
      meta: `${summary.statusBreakdown.find((item) => item.status === "NEW")?.count ?? 0} sitting new`,
      fill: Math.max(16, Math.min(100, summary.kpis.totalReceivedToday * 20))
    },
    {
      key: "open",
      label: "Open pipeline",
      value: summary.kpis.openLeads,
      icon: <PhoneOutlined />,
      meta: `${summary.kpis.unassignedLeads} still need ownership`,
      fill: Math.max(18, Math.min(100, summary.kpis.openLeads * 8))
    },
    {
      key: "booked",
      label: "Booked",
      value: summary.kpis.bookedLeads,
      icon: <CheckCircleOutlined />,
      meta: `${summary.kpis.resolvedLeads} resolved so far`,
      fill: Math.max(12, Math.min(100, summary.kpis.bookedLeads * 18)),
      accent: true
    },
    {
      key: "coverage",
      label: "Unassigned",
      value: summary.kpis.unassignedLeads,
      icon: <CompassOutlined />,
      meta: `${summary.agentWorkload.length} staff in rotation`,
      fill: Math.max(12, Math.min(100, summary.kpis.unassignedLeads * 20))
    }
  ];

  function updateComposeParam(open: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set("compose", "new-lead");
    } else {
      params.delete("compose");
    }
    router.push(params.toString() ? `/crm?${params.toString()}` : "/crm");
  }

  async function handleFilterSubmit(values: Record<string, string | undefined>) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        params.set(key, value);
      }
    }

    router.push(params.toString() ? `/crm?${params.toString()}` : "/crm");
  }

  async function handleCreateLead(values: Record<string, string | Dayjs | undefined>) {
    const preferredCallbackAt =
      values.preferredCallbackAt && dayjs.isDayjs(values.preferredCallbackAt)
        ? values.preferredCallbackAt.toISOString()
        : null;

    const requestBody = {
      type: values.type,
      channel: values.channel,
      priority: values.priority,
      customerName: values.customerName,
      phone: values.phone,
      locationText: values.locationText,
      preferredCallbackAt,
      assignedStaffId: typeof values.assignedStaffId === "string" && values.assignedStaffId ? values.assignedStaffId : null,
      notesSummary: typeof values.notesSummary === "string" && values.notesSummary ? values.notesSummary : null,
      packageCode: typeof values.packageCode === "string" && values.packageCode ? values.packageCode : undefined,
      city: typeof values.city === "string" && values.city ? values.city : undefined,
      metadata: {
        source: "crm-manual"
      }
    };

    const response = await fetch("/crm/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      toast.error("Lead creation failed", payload?.error || "Unable to create lead.");
      return;
    }

    toast.success("Lead created", "The enquiry has been added to the CRM queue.");
    createForm.resetFields();
    updateComposeParam(false);
    router.refresh();
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card bordered={false} className={styles.heroCard}>
        <div className={styles.heroGrid}>
          <Space direction="vertical" size={18}>
            <Tag className={styles.eyebrowTag}>Regional dashboard</Tag>
            <Title className={styles.heroHeadline}>Launch demand, follow-up, and handoff in one rhythm.</Title>
            <Paragraph className={styles.heroDescription}>
              Track every enquiry across Mumbai and Goa, keep ownership visible, and push the next action forward
              without switching between disconnected tools.
            </Paragraph>
            <Space wrap>
              <Button type="primary" icon={<PlusOutlined />} className={styles.newLeadButton} onClick={() => updateComposeParam(true)}>
                New lead
              </Button>
              <Tag className={styles.pill}>Recent activity: {summary.recentActivities.length}</Tag>
              <Tag className={styles.pill}>Filtered view: {visibleLeadCount}</Tag>
              {activeFilterCount ? <Tag className={styles.pill}>Active filters: {activeFilterCount}</Tag> : null}
            </Space>
          </Space>

          <div className={styles.heroSidebar}>
            <div className={styles.heroMiniGrid}>
              <div className={styles.miniPanel}>
                <span className={styles.miniLabel}>Today</span>
                <span className={styles.miniValue}>{summary.kpis.totalReceivedToday}</span>
                <span className={styles.miniText}>New calls and digital enquiries since morning.</span>
              </div>
              <div className={styles.miniPanel}>
                <span className={styles.miniLabel}>Coverage</span>
                <span className={styles.miniValue}>{summary.agentWorkload.length}</span>
                <span className={styles.miniText}>Agents currently carrying the launch queue.</span>
              </div>
            </div>

            <div className={styles.commandPanel}>
              <div className={styles.commandPanelHeader}>
                <div>
                  <span className={styles.commandEyebrow}>Command center</span>
                  <h3 className={styles.commandTitle}>What needs attention next</h3>
                </div>
                <span className={styles.commandMetric}>{attentionLeads.length}</span>
              </div>

              <div className={styles.commandList}>
                <div className={styles.commandItem}>
                  <span className={styles.commandLabel}>High priority</span>
                  <strong className={styles.commandValue}>{highPriorityLeads.length}</strong>
                </div>
                <div className={styles.commandItem}>
                  <span className={styles.commandLabel}>Unassigned</span>
                  <strong className={styles.commandValue}>{unassignedLeads.length}</strong>
                </div>
                <div className={styles.commandItem}>
                  <span className={styles.commandLabel}>Top owner</span>
                  <strong className={styles.commandValue}>{topOwner ? getInitials(topOwner.fullName) : "--"}</strong>
                </div>
              </div>

              <div className={styles.cityPulseGrid}>
                {cityPulse.map((item) => (
                  <div key={item.city} className={styles.cityPulseCard}>
                    <div className={styles.cityPulseTop}>
                      <span className={styles.cityPulseName}>{item.city}</span>
                      <span className={styles.cityPulseShare}>{item.share}%</span>
                    </div>
                    <div className={styles.cityPulseTrack}>
                      <div className={styles.cityPulseFill} style={{ width: `${Math.max(item.share, item.count ? 16 : 0)}%` }} />
                    </div>
                    <span className={styles.cityPulseMeta}>
                      {item.count} leads · {item.bookedCount} booked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className={styles.kpiGrid}>
        {kpiCards.map((item) => (
          <Card key={item.key} bordered={false} className={`${styles.kpiCard} ${item.accent ? styles.kpiCardAccent : ""}`}>
            <div className={styles.kpiIcon}>{item.icon}</div>
            <span className={styles.kpiLabel}>{item.label}</span>
            <span className={styles.kpiValue}>{item.value}</span>
            <span className={styles.kpiMeta}>{item.meta}</span>
            <div className={styles.kpiTrack}>
              <div className={styles.kpiFill} style={{ width: `${item.fill}%` }} />
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.dashboardGrid}>
        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <div className={styles.focusGrid}>
            <Card bordered={false} className={`${styles.surfaceCard} ${styles.focusCard}`}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Attention now</h3>
                  <p className={styles.sectionSubtitle}>The next conversations that need a human move.</p>
                </div>
                <Tag className={styles.pill}>{attentionLeads.length} in focus</Tag>
              </div>

              <div className={styles.focusList}>
                {attentionLeads.length ? (
                  attentionLeads.map((lead) => (
                    <Link key={lead.id} href={`/crm/leads/${lead.id}`} className={styles.focusItem}>
                      <div className={styles.focusItemHeader}>
                        <span className={styles.focusAvatar}>{getInitials(lead.customerName)}</span>
                        <div>
                          <strong className={styles.focusName}>{lead.customerName}</strong>
                          <div className={styles.mutedText}>{lead.city || lead.locationText}</div>
                        </div>
                      </div>
                      <div className={styles.focusTags}>
                        <span className={`${styles.statusChip} ${statusColor(lead.status)}`}>{humanizeToken(lead.status)}</span>
                        <span className={styles.priorityChip}>{humanizeToken(lead.priority)}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className={styles.emptyState}>No urgent leads in the current slice. The queue looks healthy right now.</div>
                )}
              </div>
            </Card>

            <Card bordered={false} className={`${styles.surfaceCard} ${styles.focusCardAlt}`}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Callback watch</h3>
                  <p className={styles.sectionSubtitle}>Upcoming promises we should not miss.</p>
                </div>
              </div>

              <div className={styles.watchList}>
                {callbackDueLeads.length ? (
                  callbackDueLeads.map((lead) => (
                    <div key={lead.id} className={styles.watchItem}>
                      <div>
                        <strong>{lead.customerName}</strong>
                        <div className={styles.mutedText}>{lead.assignedStaff?.fullName || "Needs owner"}</div>
                      </div>
                      <div className={styles.watchMeta}>
                        <span>{formatDateTime(lead.preferredCallbackAt)}</span>
                        <span className={styles.mutedText}>{humanizeToken(lead.channel)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No callback windows are scheduled in this filtered view yet.</div>
                )}
              </div>
            </Card>
          </div>

          <Card bordered={false} className={`${styles.surfaceCard} ${styles.toolbarCard}`}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Queue controls</h3>
                <p className={styles.sectionSubtitle}>Filter the launch queue and jump straight to the next conversation.</p>
              </div>
            </div>

            <Form form={filterForm} layout="vertical" initialValues={initialFilters} onFinish={handleFilterSubmit}>
              <div className={styles.filterGrid}>
                <Form.Item label="Search" name="search">
                  <Input placeholder="Name, phone, package" />
                </Form.Item>
                <Form.Item label="Status" name="status">
                  <Select allowClear options={leadStatusOptions.map((value) => ({ value, label: humanizeToken(value) }))} />
                </Form.Item>
                <Form.Item label="Channel" name="channel">
                  <Select allowClear options={leadChannelOptions.map((value) => ({ value, label: humanizeToken(value) }))} />
                </Form.Item>
                <Form.Item label="Type" name="type">
                  <Select allowClear options={leadTypeOptions.map((value) => ({ value, label: humanizeToken(value) }))} />
                </Form.Item>
                <Form.Item label="City" name="city">
                  <Select allowClear options={["Mumbai", "Goa"].map((value) => ({ value, label: value }))} />
                </Form.Item>
                {user.role === "ADMIN" ? (
                  <Form.Item label="Owner" name="assignedStaffId">
                    <Select allowClear options={staff.map((member) => ({ value: member.id, label: member.fullName }))} />
                  </Form.Item>
                ) : null}
              </div>
              <Space wrap>
                <Button type="primary" htmlType="submit">
                  Apply filters
                </Button>
                <Button onClick={() => router.push("/crm")}>Reset</Button>
              </Space>
            </Form>
          </Card>

          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Recent inquiries</h3>
                <p className={styles.sectionSubtitle}>Real-time view of the leads currently driving the launch pipeline.</p>
              </div>
              <Tag className={styles.pill}>{visibleLeadCount} visible leads</Tag>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className={styles.crmTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Priority</th>
                    <th>Last action</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <div className={styles.customerRow}>
                          <span className={styles.customerAvatar}>{getInitials(lead.customerName)}</span>
                          <div>
                            <Link href={`/crm/leads/${lead.id}`} className={styles.tableLink}>
                              {lead.customerName}
                            </Link>
                            <div className={styles.mutedText}>{lead.phoneE164}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Text strong>{lead.packageCode ? formatPackageDisplay(lead.packageCode) : humanizeToken(lead.type)}</Text>
                        <div className={styles.mutedText}>
                          {lead.packageCode ? `${lead.packageCode} · ` : ""}
                          {lead.city || lead.locationText}
                        </div>
                      </td>
                      <td>
                        <span className={`${styles.statusChip} ${statusColor(lead.status)}`}>{humanizeToken(lead.status)}</span>
                        <div className={styles.mutedText} style={{ marginTop: 8 }}>
                          {humanizeToken(lead.channel)}
                        </div>
                      </td>
                      <td>
                        <Text>{lead.assignedStaff?.fullName || "Unassigned"}</Text>
                        <div className={styles.mutedText}>{lead.preferredCallbackAt ? formatDateTime(lead.preferredCallbackAt) : "No callback set"}</div>
                      </td>
                      <td>
                        <span className={styles.priorityChip}>{humanizeToken(lead.priority)}</span>
                      </td>
                      <td>
                        <Text>{formatRelativeTime(lead.updatedAt)}</Text>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </Space>

        <Space direction="vertical" size={20} style={{ width: "100%" }}>
          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Today&apos;s rhythm</h3>
                <p className={styles.sectionSubtitle}>The most recent actions moving the queue forward.</p>
              </div>
            </div>
            <div className={styles.railList}>
              {summary.recentActivities.slice(0, 4).map((item) => (
                <div key={item.id} className={styles.railItem}>
                  <span className={styles.railTime}>{formatRelativeTime(item.createdAt)}</span>
                  <span className={styles.railTitle}>
                    {item.staffUser?.fullName || "System"} · {item.leadRecord.customerName}
                  </span>
                  <span className={styles.railBody}>{item.body}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Team coverage</h3>
                <p className={styles.sectionSubtitle}>Open lead load across the launch team.</p>
              </div>
            </div>
            <div className={styles.summaryList}>
              {summary.agentWorkload.map((member) => (
                <div key={member.id} className={styles.summaryItem}>
                  <Space style={{ width: "100%", justifyContent: "space-between" }}>
                    <div>
                      <Text strong>{member.fullName}</Text>
                      <div className={styles.mutedText}>{member.role}</div>
                    </div>
                    <Tag className={styles.pill}>{member.openLeadCount} open</Tag>
                  </Space>
                </div>
              ))}
            </div>
          </Card>

          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Lead mix</h3>
                <p className={styles.sectionSubtitle}>Status and channel signals from the current queue.</p>
              </div>
            </div>
            <div className={styles.summaryList}>
              {summary.statusBreakdown.slice(0, 3).map((item) => (
                <div key={item.status} className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{humanizeToken(item.status)}</span>
                  <span className={styles.summaryValue}>{item.count} leads</span>
                </div>
              ))}
              {summary.channelBreakdown.slice(0, 2).map((item) => (
                <div key={item.channel} className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{humanizeToken(item.channel)}</span>
                  <span className={styles.summaryValue}>{item.count} received</span>
                </div>
              ))}
            </div>
          </Card>

          <Card bordered={false} className={styles.surfaceCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Zoho sync health</h3>
                <p className={styles.sectionSubtitle}>Outbound queue, sync, and failure visibility (read-only).</p>
              </div>
              {syncHealth.queue.deadLetterCount > 0 ? (
                <Tag color="error">{syncHealth.queue.deadLetterCount} dead-letter</Tag>
              ) : (
                <Tag className={styles.pill}>Healthy</Tag>
              )}
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Pending</span>
                <span className={styles.summaryValue}>{syncHealth.counts.PENDING}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Processing</span>
                <span className={styles.summaryValue}>{syncHealth.counts.PROCESSING}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Failed (retrying)</span>
                <span className={styles.summaryValue}>{syncHealth.counts.FAILED}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Dead-letter</span>
                <span className={styles.summaryValue}>{syncHealth.counts.DEAD}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Succeeded</span>
                <span className={styles.summaryValue}>{syncHealth.counts.SUCCEEDED}</span>
              </div>
            </div>

            <div className={styles.summaryList} style={{ marginTop: 12 }}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Active backlog</span>
                <span className={styles.summaryValue}>{syncHealth.queue.activeBacklog}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Due now</span>
                <span className={styles.summaryValue}>{syncHealth.queue.dueNow}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Oldest pending</span>
                <span className={styles.summaryValue}>
                  {syncHealth.queue.oldestPendingAt ? formatRelativeTime(syncHealth.queue.oldestPendingAt) : "None"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <p className={styles.sectionSubtitle}>Recent sync failures</p>
              <div className={styles.railList}>
                {syncHealth.recentFailures.length ? (
                  syncHealth.recentFailures.map((failure) => (
                    <div key={failure.id} className={styles.railItem}>
                      <span className={styles.railTime}>
                        {failure.status === "DEAD" ? (
                          <Tag color="error">DEAD</Tag>
                        ) : (
                          <Tag color="warning">FAILED</Tag>
                        )}{" "}
                        {formatRelativeTime(failure.updatedAt)} · attempt {failure.attempts}
                      </span>
                      <span className={styles.railTitle}>Lead {failure.aggregateId.slice(0, 8)}</span>
                      <span className={styles.railBody}>{failure.lastError || "No error detail recorded."}</span>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>No sync failures recorded. The outbound queue is clean.</div>
                )}
              </div>
            </div>
          </Card>
        </Space>
      </div>

      <Drawer
        title="Create a new lead"
        placement="right"
        width={560}
        open={openLeadComposer}
        onClose={() => updateComposeParam(false)}
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateLead} initialValues={{ type: "ENQUIRY", channel: "PHONE", priority: "MEDIUM" }}>
          <div className={styles.drawerFormGrid}>
            <Form.Item label="Type" name="type" rules={[{ required: true }]}>
              <Select options={leadTypeOptions.map((value) => ({ value, label: humanizeToken(value) }))} />
            </Form.Item>
            <Form.Item label="Channel" name="channel" rules={[{ required: true }]}>
              <Select options={["PHONE", "WHATSAPP", "MANUAL"].map((value) => ({ value, label: humanizeToken(value) }))} />
            </Form.Item>
            <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
              <Select options={leadPriorityOptions.map((value) => ({ value, label: humanizeToken(value) }))} />
            </Form.Item>
            <Form.Item label="Customer name" name="customerName" rules={[{ required: true }]} className={styles.fullSpan}>
              <Input placeholder="Family contact" />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
              <Input placeholder="+91 98..." />
            </Form.Item>
            <Form.Item label="City" name="city">
              <Select allowClear options={[{ value: "Mumbai", label: "Mumbai" }, { value: "Goa", label: "Goa" }]} />
            </Form.Item>
            <Form.Item label="Package code" name="packageCode">
              <Select
                allowClear
                options={[
                  { value: "package-essential", label: "Essential" },
                  { value: "package-comfort", label: "Comfort" }
                ]}
                placeholder="Optional"
                showSearch
              />
            </Form.Item>
            <Form.Item label="Preferred callback" name="preferredCallbackAt">
              <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
            <Form.Item label="Location" name="locationText" rules={[{ required: true }]} className={styles.fullSpan}>
              <Input placeholder="Area, locality, or city" />
            </Form.Item>
            {user.role === "ADMIN" ? (
              <Form.Item label="Assign to" name="assignedStaffId" className={styles.fullSpan}>
                <Select allowClear options={staff.map((member) => ({ value: member.id, label: member.fullName }))} />
              </Form.Item>
            ) : null}
            <Form.Item label="Summary note" name="notesSummary" className={styles.fullSpan}>
              <Input.TextArea rows={4} placeholder="Key need, objection, referral, or promised next step." />
            </Form.Item>
          </div>

          <Space>
            <Button type="primary" htmlType="submit">
              Save lead
            </Button>
            <Button onClick={() => updateComposeParam(false)}>Cancel</Button>
          </Space>
        </Form>
      </Drawer>
    </Space>
  );
}
