"use client";

import { PlusOutlined, SaveOutlined, SendOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import InlineMediaUpload from "./inline-media-upload";
import { formatDateTime, humanizeToken } from "../types";
import type {
  ContentItemMap,
  ContentModuleKey,
  ContentModuleMeta,
  DoctorContentItem,
  GalleryContentItem,
  HomepageSectionContentItem,
  HomepageSectionKey,
  MediaItem,
  PackageAddOnItem,
  PackageContentItem,
  PackageFeatureItem,
  TestimonialContentItem
} from "./content-studio";
import {
  canCreateNewRecord,
  createEmptyContentItem,
  getContentItemId,
  getContentItemLabel,
  getContentItemStatus,
  getMediaOptions,
  homepageSectionOptions,
  normalizeFaqItems,
  parseBenefitsLines,
  toBenefitsLines
} from "./content-studio";
import styles from "../crm.module.css";
import { useCrmToast } from "../use-crm-toast";
const { Paragraph, Text, Title } = Typography;

type EditableModuleKey = Exclude<ContentModuleKey, "media">;
type EditableContentItem = ContentItemMap[EditableModuleKey];

const cityOptions = [
  { value: "Mumbai", label: "Mumbai" },
  { value: "Goa", label: "Goa" }
];

const languageOptions = [
  { value: "EN", label: "English" },
  { value: "HI", label: "Hindi" }
];

const moderationStatusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" }
];

const sharedMediaSelectProps = {
  allowClear: true,
  showSearch: true,
  optionFilterProp: "label" as const
};

function statusColor(status?: string) {
  switch (status) {
    case "PUBLISHED":
      return "green";
    case "ARCHIVED":
      return "default";
    case "PENDING_REVIEW":
      return "gold";
    case "DRAFT":
    default:
      return "blue";
  }
}

function recordSelectionKey(moduleKey: EditableModuleKey, item: EditableContentItem) {
  const id = getContentItemId(item);
  if (id) {
    return id;
  }

  if (moduleKey === "homepage") {
    return (item as HomepageSectionContentItem).sectionKey;
  }

  return `${moduleKey}-${getContentItemLabel(moduleKey, item)}`;
}

function normalizeFormValues(moduleKey: EditableModuleKey, item: EditableContentItem) {
  switch (moduleKey) {
    case "packages": {
      const value = item as PackageContentItem;
      return {
        ...value,
        visualMediaId: value.visualMediaId || undefined,
        features: value.features.map((feature) => ({
          ...feature,
          benefitsText: toBenefitsLines(feature.benefitsJson)
        })),
        addOns: value.addOns.map((addOn) => ({
          ...addOn,
          benefitsText: toBenefitsLines(addOn.benefitsJson)
        }))
      };
    }
    case "testimonials": {
      const value = item as TestimonialContentItem;
      return {
        ...value,
        relation: value.relation || "",
        photoMediaId: value.photoMediaId || undefined
      };
    }
    case "doctors": {
      const value = item as DoctorContentItem;
      return {
        ...value,
        photoMediaId: value.photoMediaId || undefined
      };
    }
    case "gallery": {
      const value = item as GalleryContentItem;
      return {
        ...value,
        beforeMediaId: value.beforeMediaId || undefined,
        afterMediaId: value.afterMediaId || undefined,
        primaryTag: value.primaryTag || "",
        secondaryTag: value.secondaryTag || ""
      };
    }
    case "homepage": {
      const value = item as HomepageSectionContentItem;
      const payload = (value.jsonPayload ?? {}) as Record<string, unknown>;
      return {
        ...value,
        primaryCta: typeof payload.primaryCta === "string" ? payload.primaryCta : "",
        secondaryCta: typeof payload.secondaryCta === "string" ? payload.secondaryCta : "",
        secondaryLabel: typeof payload.secondaryLabel === "string" ? payload.secondaryLabel : "",
        supportPoints:
          Array.isArray(payload.supportPoints) && payload.supportPoints.every((point) => typeof point === "string")
            ? payload.supportPoints
            : [],
        faqItems: normalizeFaqItems(payload.items),
        rawJsonPayload: JSON.stringify(value.jsonPayload ?? {}, null, 2)
      };
    }
  }
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const next = cleanString(value);
  return next || null;
}

function cleanOptionalString(value: unknown) {
  const next = cleanString(value);
  return next || undefined;
}

function cleanStringList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean)
    : [];
}

function buildPackageArray<T extends { sortOrder?: number; description?: string; label?: string }>(
  value: unknown,
  mapper: (item: Record<string, unknown>, index: number) => T
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => mapper((item ?? {}) as Record<string, unknown>, index));
}

function parseJsonText(value: unknown) {
  const source = cleanString(value);
  if (!source) {
    return {};
  }

  return JSON.parse(source) as Record<string, unknown>;
}

function buildSavePayload(moduleKey: EditableModuleKey, values: Record<string, unknown>, current: EditableContentItem) {
  switch (moduleKey) {
    case "packages": {
      const value = current as PackageContentItem;
      return {
        id: value.id,
        code: cleanString(values.code),
        name: cleanString(values.name),
        city: values.city,
        language: values.language,
        bathroomsCover: Number(values.bathroomsCover ?? 1),
        pricePaise: Number(values.pricePaise ?? 0),
        active: Boolean(values.active),
        badge: cleanNullableString(values.badge),
        titleDescriptor: cleanNullableString(values.titleDescriptor),
        bestFor: cleanNullableString(values.bestFor),
        outcome: cleanNullableString(values.outcome),
        summary: cleanNullableString(values.summary),
        ctaLabel: cleanNullableString(values.ctaLabel),
        sortOrder: Number(values.sortOrder ?? 0),
        status: typeof values.status === "string" ? values.status : value.status || "DRAFT",
        visualMediaId: cleanNullableString(values.visualMediaId),
        features: buildPackageArray(values.features, (item, index) => ({
          id: typeof item.id === "string" ? item.id : undefined,
          featureKey: cleanString(item.featureKey),
          label: cleanString(item.label),
          description: cleanOptionalString(item.description),
          benefits: parseBenefitsLines(typeof item.benefitsText === "string" ? item.benefitsText : undefined),
          sortOrder: Number(item.sortOrder ?? index)
        })).filter((item) => item.featureKey && item.label),
        addOns: buildPackageArray(values.addOns, (item, index) => ({
          id: typeof item.id === "string" ? item.id : undefined,
          addOnKey: cleanString(item.addOnKey),
          label: cleanString(item.label),
          description: cleanOptionalString(item.description),
          benefits: parseBenefitsLines(typeof item.benefitsText === "string" ? item.benefitsText : undefined),
          sortOrder: Number(item.sortOrder ?? index)
        })).filter((item) => item.addOnKey && item.label)
      };
    }
    case "testimonials": {
      const value = current as TestimonialContentItem;
      return {
        id: value.id,
        buyerName: cleanString(values.buyerName),
        relation: cleanNullableString(values.relation),
        city: values.city,
        language: values.language,
        testimonial: cleanString(values.testimonial),
        rating: values.rating === undefined || values.rating === null ? null : Number(values.rating),
        status: typeof values.status === "string" ? values.status : value.status || "DRAFT",
        isFeatured: Boolean(values.isFeatured),
        photoMediaId: cleanNullableString(values.photoMediaId),
        sortOrder: Number(values.sortOrder ?? 0)
      };
    }
    case "doctors": {
      const value = current as DoctorContentItem;
      return {
        id: value.id,
        doctorName: cleanString(values.doctorName),
        specialty: cleanString(values.specialty),
        registrationNumber: cleanString(values.registrationNumber),
        registrationBody: cleanString(values.registrationBody),
        city: values.city,
        language: values.language,
        statement: cleanString(values.statement),
        status: typeof values.status === "string" ? values.status : value.status || "DRAFT",
        isFeatured: Boolean(values.isFeatured),
        photoMediaId: cleanNullableString(values.photoMediaId),
        sortOrder: Number(values.sortOrder ?? 0)
      };
    }
    case "gallery": {
      const value = current as GalleryContentItem;
      return {
        id: value.id,
        title: cleanString(values.title),
        caption: cleanString(values.caption),
        beforeMediaId: cleanNullableString(values.beforeMediaId),
        afterMediaId: cleanNullableString(values.afterMediaId),
        primaryTag: cleanNullableString(values.primaryTag),
        secondaryTag: cleanNullableString(values.secondaryTag),
        sortOrder: Number(values.sortOrder ?? 0),
        status: typeof values.status === "string" ? values.status : value.status || "DRAFT"
      };
    }
    case "homepage": {
      const value = current as HomepageSectionContentItem;
      const sectionKey = cleanString(values.sectionKey);
      let jsonPayload: Record<string, unknown>;

      switch (sectionKey) {
        case "hero":
          jsonPayload = {
            primaryCta: cleanString(values.primaryCta),
            secondaryCta: cleanString(values.secondaryCta),
            supportPoints: cleanStringList(values.supportPoints)
          };
          break;
        case "faq":
          jsonPayload = {
            items: Array.isArray(values.faqItems)
              ? values.faqItems
                  .map((item) => {
                    const record = (item ?? {}) as Record<string, unknown>;
                    const question = cleanString(record.question);
                    const answer = cleanString(record.answer);
                    if (!question && !answer) {
                      return null;
                    }
                    return { question, answer };
                  })
                  .filter(Boolean)
              : []
          };
          break;
        case "final-cta":
          jsonPayload = {
            primaryCta: cleanString(values.primaryCta),
            secondaryLabel: cleanString(values.secondaryLabel)
          };
          break;
        default:
          jsonPayload = parseJsonText(values.rawJsonPayload);
      }

      return {
        id: value.id,
        sectionKey: sectionKey as HomepageSectionKey,
        title: cleanNullableString(values.title),
        subtitle: cleanNullableString(values.subtitle),
        eyebrow: cleanNullableString(values.eyebrow),
        body: cleanNullableString(values.body),
        status: typeof values.status === "string" ? values.status : value.status || "DRAFT",
        jsonPayload
      };
    }
  }
}

function upsertRecord(moduleKey: EditableModuleKey, records: EditableContentItem[], saved: EditableContentItem) {
  const nextKey = recordSelectionKey(moduleKey, saved);
  const updated = records.filter((item) => recordSelectionKey(moduleKey, item) !== nextKey);
  return [...updated, saved].sort((left, right) => {
    const leftSort = "sortOrder" in left && typeof left.sortOrder === "number" ? left.sortOrder : 0;
    const rightSort = "sortOrder" in right && typeof right.sortOrder === "number" ? right.sortOrder : 0;
    if (leftSort !== rightSort) {
      return leftSort - rightSort;
    }
    return getContentItemLabel(moduleKey, left).localeCompare(getContentItemLabel(moduleKey, right));
  });
}

function validatePublishRecord(moduleKey: EditableModuleKey, item: EditableContentItem) {
  switch (moduleKey) {
    case "doctors": {
      const doctor = item as DoctorContentItem;
      if (!doctor.doctorName || !doctor.specialty || !doctor.registrationNumber || !doctor.registrationBody || !doctor.statement) {
        return "Complete all doctor credential and statement fields before publishing.";
      }
      return null;
    }
    case "gallery": {
      const gallery = item as GalleryContentItem;
      if (!gallery.beforeMediaId || !gallery.afterMediaId) {
        return "Gallery records need both before and after assets before publishing.";
      }
      return null;
    }
    default:
      return null;
  }
}

function getPreviewHref(moduleMeta: ContentModuleMeta) {
  if (!moduleMeta.previewPath) {
    return null;
  }

  return `${moduleMeta.previewPath}?preview=draft`;
}

function getLiveHref(moduleMeta: ContentModuleMeta) {
  return moduleMeta.previewPath ?? null;
}

function MediaPreview({
  mediaId,
  mediaItems
}: {
  mediaId?: string | null;
  mediaItems: MediaItem[];
}) {
  const asset = mediaItems.find((item) => item.id === mediaId);
  if (!asset) {
    return <Text type="secondary">No asset selected.</Text>;
  }

  return (
    <Space size={12}>
      <img
        src={asset.url}
        alt={asset.altText || asset.id}
        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(132,66,44,0.12)" }}
      />
      <Space direction="vertical" size={2}>
        <Text strong>{asset.altText || "Uploaded image"}</Text>
        <Text type="secondary">{asset.id}</Text>
      </Space>
    </Space>
  );
}

function MediaField({
  label,
  fieldName,
  mediaItems,
  mediaOptions,
  watchedMediaId,
  onUploaded
}: {
  label: string;
  fieldName: "visualMediaId" | "photoMediaId" | "beforeMediaId" | "afterMediaId";
  mediaItems: MediaItem[];
  mediaOptions: Array<{ value: string; label: string }>;
  watchedMediaId?: string | null;
  onUploaded: (asset: MediaItem) => void;
}) {
  return (
    <>
      <Space align="start" style={{ width: "100%" }}>
        <Form.Item label={label} name={fieldName} style={{ flex: 1, marginBottom: 8 }}>
          <Select {...sharedMediaSelectProps} options={mediaOptions} placeholder="Choose an uploaded asset" />
        </Form.Item>
        <div style={{ paddingTop: 30 }}>
          <InlineMediaUpload label={label} onUploaded={onUploaded} />
        </div>
      </Space>
      <MediaPreview mediaId={watchedMediaId} mediaItems={mediaItems} />
    </>
  );
}

function PackageArrayEditor({
  name,
  title,
  kind
}: {
  name: "features" | "addOns";
  title: string;
  kind: "feature" | "addOn";
}) {
  return (
    <Form.List name={name}>
      {(fields, { add, remove }) => (
        <Card
          title={title}
          extra={
            <Button onClick={() => add({ sortOrder: fields.length, benefitsText: "" })} icon={<PlusOutlined />}>
              Add {kind}
            </Button>
          }
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {fields.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={`No ${title.toLowerCase()} added yet.`} /> : null}
            {fields.map((field) => (
              <Card
                key={field.key}
                size="small"
                type="inner"
                title={`${humanizeToken(kind)} ${field.name + 1}`}
                extra={
                  <Button danger type="link" onClick={() => remove(field.name)}>
                    Remove
                  </Button>
                }
              >
                <Row gutter={[12, 12]}>
                  <Col xs={24} md={10}>
                    <Form.Item
                      label={kind === "feature" ? "Feature key" : "Add-on key"}
                      name={[field.name, kind === "feature" ? "featureKey" : "addOnKey"]}
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={10}>
                    <Form.Item label="Label" name={[field.name, "label"]} rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={4}>
                    <Form.Item label="Sort" name={[field.name, "sortOrder"]}>
                      <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Description" name={[field.name, "description"]}>
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item
                      label="Benefits"
                      name={[field.name, "benefitsText"]}
                      extra="One benefit per line."
                    >
                      <Input.TextArea rows={4} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        </Card>
      )}
    </Form.List>
  );
}

export default function ContentModuleView({
  userRole,
  moduleKey,
  moduleMeta,
  items,
  mediaItems
}: {
  userRole: "ADMIN" | "AGENT";
  moduleKey: EditableModuleKey;
  moduleMeta: ContentModuleMeta;
  items: EditableContentItem[];
  mediaItems: MediaItem[];
}) {
  const router = useRouter();
  const toast = useCrmToast();
  const [form] = Form.useForm();
  const [records, setRecords] = useState(items);
  const [selectedKey, setSelectedKey] = useState(items[0] ? recordSelectionKey(moduleKey, items[0]) : "new");
  const [creatingNew, setCreatingNew] = useState(items.length === 0);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [mediaLibrary, setMediaLibrary] = useState(mediaItems);
  const mediaOptions = useMemo(() => getMediaOptions(mediaLibrary), [mediaLibrary]);
  const watchedSectionKey = Form.useWatch("sectionKey", form);
  const watchedVisualMediaId = Form.useWatch("visualMediaId", form);
  const watchedPhotoMediaId = Form.useWatch("photoMediaId", form);
  const watchedBeforeMediaId = Form.useWatch("beforeMediaId", form);
  const watchedAfterMediaId = Form.useWatch("afterMediaId", form);
  const activeRecord = useMemo(() => {
    if (creatingNew) {
      return createEmptyContentItem(moduleKey) as EditableContentItem;
    }

    return records.find((item) => recordSelectionKey(moduleKey, item) === selectedKey) ?? records[0] ?? (createEmptyContentItem(moduleKey) as EditableContentItem);
  }, [creatingNew, moduleKey, records, selectedKey]);

  useEffect(() => {
    form.setFieldsValue(normalizeFormValues(moduleKey, activeRecord));
  }, [activeRecord, form, moduleKey]);

  useEffect(() => {
    setMediaLibrary(mediaItems);
  }, [mediaItems]);

  const publishedCount = records.filter((item) => getContentItemStatus(item) === "PUBLISHED").length;
  const reviewCount = records.filter((item) => getContentItemStatus(item) === "PENDING_REVIEW").length;
  const canPublish = userRole === "ADMIN" && moduleMeta.publishEntityType !== undefined;
  const draftPreviewHref = getPreviewHref(moduleMeta);
  const liveHref = getLiveHref(moduleMeta);
  const handleMediaUploaded =
    (fieldName: "visualMediaId" | "photoMediaId" | "beforeMediaId" | "afterMediaId") => (asset: MediaItem) => {
      setMediaLibrary((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
      form.setFieldValue(fieldName, asset.id);
    };
  const filteredRecords = useMemo(
    () =>
      statusFilter === "ALL" ? records : records.filter((item) => getContentItemStatus(item) === statusFilter),
    [records, statusFilter]
  );

  async function saveCurrent(values: Record<string, unknown>) {
    let payload: Record<string, unknown>;
    try {
      payload = buildSavePayload(moduleKey, { ...values, status: "DRAFT" }, activeRecord) as Record<string, unknown>;
    } catch (error) {
      toast.error("Draft save failed", error instanceof Error ? error.message : "Please fix the invalid editor content.");
      return;
    }

    const response = await fetch(`/crm/api/content/${moduleKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = (await response.json().catch(() => null)) as { data?: EditableContentItem; error?: string } | null;
    if (!response.ok || !result?.data) {
      toast.error("Draft save failed", result?.error || "Unable to save content.");
      return;
    }

    const nextRecords = upsertRecord(moduleKey, records, result.data);
    setRecords(nextRecords);
    setCreatingNew(false);
    setSelectedKey(recordSelectionKey(moduleKey, result.data));
    form.setFieldsValue(normalizeFormValues(moduleKey, result.data));
    toast.success("Draft saved", "Your content changes are now stored in the control panel.");
    router.refresh();
  }

  async function updateRecordStatus(nextStatus: "PENDING_REVIEW" | "ARCHIVED") {
    const values = form.getFieldsValue(true) as Record<string, unknown>;
    const label = nextStatus === "PENDING_REVIEW" ? "submitted for review" : "archived";
    const payload = buildSavePayload(moduleKey, { ...values, status: nextStatus }, activeRecord) as EditableContentItem;
    const response = await fetch(`/crm/api/content/${moduleKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ ...payload, status: nextStatus })
    });

    const result = (await response.json().catch(() => null)) as { data?: EditableContentItem; error?: string } | null;
    if (!response.ok || !result?.data) {
      toast.error("Status update failed", result?.error || "Unable to update record status.");
      return;
    }

    const nextRecords = upsertRecord(moduleKey, records, result.data);
    setRecords(nextRecords);
    setCreatingNew(false);
    setSelectedKey(recordSelectionKey(moduleKey, result.data));
    form.setFieldsValue(normalizeFormValues(moduleKey, result.data));
    toast.success("Status updated", `Record ${label}.`);
    router.refresh();
  }

  async function publishCurrent() {
    const id = getContentItemId(activeRecord);
    if (!id || !moduleMeta.publishEntityType) {
      toast.error("Publish blocked", "Save this record as a draft before publishing.");
      return;
    }

    const publishError = validatePublishRecord(moduleKey, activeRecord);
    if (publishError) {
      toast.error("Publish blocked", publishError);
      return;
    }

    const response = await fetch("/crm/api/content/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        entityType: moduleMeta.publishEntityType,
        entityId: id
      })
    });

    const result = (await response.json().catch(() => null)) as { data?: Record<string, unknown>; error?: string } | null;
    if (!response.ok) {
      toast.error("Publish failed", result?.error || "Unable to publish content.");
      return;
    }

    const next = { ...activeRecord, status: "PUBLISHED" } as EditableContentItem;
    const nextRecords = upsertRecord(moduleKey, records, next);
    setRecords(nextRecords);
    form.setFieldValue("status", "PUBLISHED");
    toast.success("Published", "This content is now marked live for the website.");
    router.refresh();
  }

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card bordered={false} className={`${styles.heroCard} ${styles.moduleHeaderCard}`}>
        <div className={styles.heroGrid}>
          <Space direction="vertical" size={16}>
            <Tag className={styles.eyebrowTag}>{moduleMeta.title}</Tag>
            <Title className={styles.heroHeadline} style={{ fontSize: "clamp(2rem, 2.5vw, 3rem)" }}>
              Structured editing for launch-stage content.
            </Title>
            <Paragraph className={styles.heroDescription}>{moduleMeta.description}</Paragraph>
          </Space>

          <div className={styles.heroMiniGrid}>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Records</span>
              <span className={styles.miniValue}>{records.length}</span>
              <span className={styles.miniText}>Available entries in this module.</span>
            </div>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Published</span>
              <span className={styles.miniValue}>{publishedCount}</span>
              <span className={styles.miniText}>{mediaItems.length} uploaded assets are available to editors.</span>
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} xl={8}>
          <Card
            bordered={false}
            className={`${styles.surfaceCard} ${styles.recordListCard}`}
            title={moduleMeta.title}
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                disabled={!canCreateNewRecord(moduleKey)}
                onClick={() => {
                  setCreatingNew(true);
                  setSelectedKey("new");
                }}
              >
                New
              </Button>
            }
          >
            <Paragraph className={styles.mutedText}>{moduleMeta.description}</Paragraph>
            <Space wrap style={{ marginBottom: 12 }}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                options={[{ value: "ALL", label: "All statuses" }, ...moderationStatusOptions]}
                style={{ minWidth: 180 }}
              />
              <Tag className={styles.pill}>{records.length} total</Tag>
              <Tag className={styles.pill} color="gold">
                {reviewCount} in review
              </Tag>
            </Space>
            <Divider style={{ margin: "16px 0" }} />
            <List
              dataSource={filteredRecords}
              locale={{ emptyText: "No saved records yet." }}
              renderItem={(item) => {
                const itemKey = recordSelectionKey(moduleKey, item);
                const selected = !creatingNew && itemKey === selectedKey;
                const updatedAt = "updatedAt" in item && typeof item.updatedAt === "string" ? item.updatedAt : null;

                return (
                  <List.Item style={{ paddingInline: 0 }}>
                    <Card
                      bordered={false}
                      className={`${styles.recordTile} ${selected ? styles.recordTileActive : ""}`}
                      hoverable
                      size="small"
                      onClick={() => {
                        setCreatingNew(false);
                        setSelectedKey(itemKey);
                      }}
                      style={{ width: "100%" }}
                    >
                      <Space direction="vertical" size={6} style={{ width: "100%" }}>
                        <Space wrap>
                          <Text strong>{getContentItemLabel(moduleKey, item)}</Text>
                          {getContentItemStatus(item) ? (
                            <Tag className={styles.pill} color={statusColor(getContentItemStatus(item))}>
                              {humanizeToken(getContentItemStatus(item) || "")}
                            </Tag>
                          ) : null}
                        </Space>
                        <Text type="secondary">
                          {moduleKey === "homepage"
                            ? `Section key: ${(item as HomepageSectionContentItem).sectionKey}`
                            : updatedAt
                              ? `Updated ${formatDateTime(updatedAt)}`
                              : "Ready for editing"}
                        </Text>
                      </Space>
                    </Card>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        <Col xs={24} xl={16}>
          <Form
            form={form}
            layout="vertical"
            onFinish={saveCurrent}
            initialValues={normalizeFormValues(moduleKey, activeRecord)}
          >
            <Card
              bordered={false}
              className={`${styles.surfaceCard} ${styles.editorCard}`}
              title={creatingNew ? `Create ${moduleMeta.title.slice(0, -1) || moduleMeta.title}` : getContentItemLabel(moduleKey, activeRecord)}
              extra={
                <Space wrap>
                  {draftPreviewHref ? (
                    <Button href={draftPreviewHref} target="_blank">
                      Preview draft
                    </Button>
                  ) : null}
                  {liveHref ? (
                    <Button href={liveHref} target="_blank">
                      View live
                    </Button>
                  ) : null}
                  {getContentItemStatus(activeRecord) ? (
                    <Tag className={styles.pill} color={statusColor(getContentItemStatus(activeRecord))}>
                      {humanizeToken(getContentItemStatus(activeRecord) || "")}
                    </Tag>
                  ) : null}
                  <Button icon={<SaveOutlined />} type="primary" htmlType="submit">
                    Save draft
                  </Button>
                  <Button onClick={() => updateRecordStatus("PENDING_REVIEW")}>Submit for review</Button>
                  {userRole === "ADMIN" ? <Button onClick={() => updateRecordStatus("ARCHIVED")}>Archive</Button> : null}
                  {canPublish ? (
                    <Button icon={<SendOutlined />} onClick={publishCurrent}>
                      Publish
                    </Button>
                  ) : null}
                </Space>
              }
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Card size="small" className={styles.inlineGuideCard}>
                  <Space direction="vertical" size={4}>
                    <Text strong>Workflow state</Text>
                    <Text className={styles.mutedText}>
                      Save draft keeps changes off the live site. Submit for review moves this record to editorial review.
                      Only admins can publish or archive.
                    </Text>
                    {draftPreviewHref || liveHref ? (
                      <Text className={styles.mutedText}>
                        Use <strong>Preview draft</strong> to review unpublished changes in page context and <strong>View live</strong> to compare against the public site.
                      </Text>
                    ) : null}
                  </Space>
                </Card>

                {moduleKey === "packages" ? (
                  <>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} md={8}>
                        <Form.Item label="Code" name="code" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Package name" name="name" rules={[{ required: true }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="CTA label" name="ctaLabel">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="City" name="city" rules={[{ required: true }]}>
                          <Select options={cityOptions} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="Language" name="language" rules={[{ required: true }]}>
                          <Select options={languageOptions} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="Bathrooms covered" name="bathroomsCover" rules={[{ required: true }]}>
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={6}>
                        <Form.Item label="Sort order" name="sortOrder">
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Price (paise)" name="pricePaise" rules={[{ required: true }]}>
                          <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Badge" name="badge">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Descriptor" name="titleDescriptor">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item label="Summary" name="summary">
                          <Input.TextArea rows={3} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="Best for" name="bestFor">
                          <Input.TextArea rows={3} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12}>
                        <Form.Item label="Outcome" name="outcome">
                          <Input.TextArea rows={3} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Active on website" name="active" valuePropName="checked">
                          <Switch />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={16}>
                        <MediaField
                          label="Visual media"
                          fieldName="visualMediaId"
                          mediaItems={mediaLibrary}
                          mediaOptions={mediaOptions}
                          watchedMediaId={watchedVisualMediaId}
                          onUploaded={handleMediaUploaded("visualMediaId")}
                        />
                      </Col>
                    </Row>
                    <PackageArrayEditor name="features" title="Included features" kind="feature" />
                    <PackageArrayEditor name="addOns" title="Add-ons" kind="addOn" />
                  </>
                ) : null}

                {moduleKey === "testimonials" ? (
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}>
                      <Form.Item label="Customer name" name="buyerName" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="Relation" name="relation">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="Sort order" name="sortOrder">
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item label="City" name="city" rules={[{ required: true }]}>
                        <Select options={cityOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item label="Language" name="language" rules={[{ required: true }]}>
                        <Select options={languageOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item label="Rating" name="rating">
                        <InputNumber min={1} max={5} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={6}>
                      <Form.Item label="Featured" name="isFeatured" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Quote" name="testimonial" rules={[{ required: true }]}>
                        <Input.TextArea rows={5} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <MediaField
                        label="Photo media"
                        fieldName="photoMediaId"
                        mediaItems={mediaLibrary}
                        mediaOptions={mediaOptions}
                        watchedMediaId={watchedPhotoMediaId}
                        onUploaded={handleMediaUploaded("photoMediaId")}
                      />
                    </Col>
                  </Row>
                ) : null}

                {moduleKey === "doctors" ? (
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={8}>
                      <Form.Item label="Doctor name" name="doctorName" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="Specialty" name="specialty" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="Sort order" name="sortOrder">
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="Registration number" name="registrationNumber" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="Registration body" name="registrationBody" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={4}>
                      <Form.Item label="City" name="city" rules={[{ required: true }]}>
                        <Select options={cityOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={4}>
                      <Form.Item label="Featured" name="isFeatured" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Language" name="language" rules={[{ required: true }]}>
                        <Select options={languageOptions} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Statement" name="statement" rules={[{ required: true }]}>
                        <Input.TextArea rows={5} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <MediaField
                        label="Photo media"
                        fieldName="photoMediaId"
                        mediaItems={mediaLibrary}
                        mediaOptions={mediaOptions}
                        watchedMediaId={watchedPhotoMediaId}
                        onUploaded={handleMediaUploaded("photoMediaId")}
                      />
                    </Col>
                  </Row>
                ) : null}

                {moduleKey === "gallery" ? (
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Title" name="title" rules={[{ required: true }]}>
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Sort order" name="sortOrder">
                        <InputNumber min={0} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item label="Caption" name="caption" rules={[{ required: true }]}>
                        <Input.TextArea rows={4} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Primary tag" name="primaryTag">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Secondary tag" name="secondaryTag">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <MediaField
                        label="Before image"
                        fieldName="beforeMediaId"
                        mediaItems={mediaLibrary}
                        mediaOptions={mediaOptions}
                        watchedMediaId={watchedBeforeMediaId}
                        onUploaded={handleMediaUploaded("beforeMediaId")}
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <MediaField
                        label="After image"
                        fieldName="afterMediaId"
                        mediaItems={mediaLibrary}
                        mediaOptions={mediaOptions}
                        watchedMediaId={watchedAfterMediaId}
                        onUploaded={handleMediaUploaded("afterMediaId")}
                      />
                    </Col>
                  </Row>
                ) : null}

                {moduleKey === "homepage" ? (
                  <>
                    <Row gutter={[12, 12]}>
                      <Col xs={24} md={8}>
                        <Form.Item label="Section key" name="sectionKey" rules={[{ required: true }]}>
                          <Select options={homepageSectionOptions as unknown as Array<{ value: string; label: string }>} disabled />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Status" name="status">
                          <Select options={moderationStatusOptions} disabled />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Eyebrow" name="eyebrow">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8}>
                        <Form.Item label="Title" name="title">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item label="Subtitle" name="subtitle">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col xs={24}>
                        <Form.Item label="Body" name="body">
                          <Input.TextArea rows={4} />
                        </Form.Item>
                      </Col>
                    </Row>

                    {cleanString(watchedSectionKey) === "hero" ? (
                      <Card size="small" title="Hero payload">
                        <Row gutter={[12, 12]}>
                          <Col xs={24} md={12}>
                            <Form.Item label="Primary CTA" name="primaryCta">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label="Secondary CTA" name="secondaryCta">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.List name="supportPoints">
                              {(fields, { add, remove }) => (
                                <Card
                                  size="small"
                                  type="inner"
                                  title="Support points"
                                  extra={<Button onClick={() => add("")}>Add point</Button>}
                                >
                                  <Space direction="vertical" size={8} style={{ width: "100%" }}>
                                    {fields.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No support points yet." /> : null}
                                    {fields.map((field) => (
                                      <Space key={field.key} align="start" style={{ width: "100%" }}>
                                        <Form.Item name={field.name} style={{ flex: 1, marginBottom: 0 }}>
                                          <Input />
                                        </Form.Item>
                                        <Button danger type="link" onClick={() => remove(field.name)}>
                                          Remove
                                        </Button>
                                      </Space>
                                    ))}
                                  </Space>
                                </Card>
                              )}
                            </Form.List>
                          </Col>
                        </Row>
                      </Card>
                    ) : null}

                    {cleanString(watchedSectionKey) === "faq" ? (
                      <Form.List name="faqItems">
                        {(fields, { add, remove }) => (
                          <Card
                            size="small"
                            title="FAQ items"
                            extra={<Button onClick={() => add({ question: "", answer: "" })}>Add FAQ</Button>}
                          >
                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                              {fields.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No FAQ items yet." /> : null}
                              {fields.map((field) => (
                                <Card
                                  key={field.key}
                                  size="small"
                                  type="inner"
                                  title={`Question ${field.name + 1}`}
                                  extra={
                                    <Button danger type="link" onClick={() => remove(field.name)}>
                                      Remove
                                    </Button>
                                  }
                                >
                                  <Form.Item label="Question" name={[field.name, "question"]} rules={[{ required: true }]}>
                                    <Input />
                                  </Form.Item>
                                  <Form.Item label="Answer" name={[field.name, "answer"]} rules={[{ required: true }]}>
                                    <Input.TextArea rows={4} />
                                  </Form.Item>
                                </Card>
                              ))}
                            </Space>
                          </Card>
                        )}
                      </Form.List>
                    ) : null}

                    {cleanString(watchedSectionKey) === "final-cta" ? (
                      <Card size="small" title="Final CTA payload">
                        <Row gutter={[12, 12]}>
                          <Col xs={24} md={12}>
                            <Form.Item label="Primary CTA" name="primaryCta">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label="Secondary label" name="secondaryLabel">
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ) : null}

                    {cleanString(watchedSectionKey) === "packages" ? (
                      <Card size="small" title="Packages section">
                        <Paragraph className={styles.mutedText} style={{ marginBottom: 12 }}>
                          This section stays typed and intentionally narrow. Layout and package-card rendering still belong to application code.
                        </Paragraph>
                        <Row gutter={[12, 12]}>
                          <Col xs={24} md={12}>
                            <Form.Item label="Section title" name="title">
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label="Section subtitle" name="subtitle">
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ) : null}

                    {!["hero", "packages", "faq", "final-cta"].includes(cleanString(watchedSectionKey)) ? (
                      <Card size="small" title="JSON payload">
                        <Form.Item
                          label="Payload"
                          name="rawJsonPayload"
                          extra="For non-standard homepage sections, use raw JSON."
                        >
                          <Input.TextArea rows={8} />
                        </Form.Item>
                      </Card>
                    ) : null}
                  </>
                ) : null}
              </Space>
            </Card>
          </Form>
        </Col>
      </Row>
    </Space>
  );
}
