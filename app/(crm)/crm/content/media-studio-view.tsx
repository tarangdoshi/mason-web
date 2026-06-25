"use client";

import { CopyOutlined, InboxOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Card, Image, Input, Space, Table, Tag, Typography, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "../types";
import type { MediaItem } from "./content-studio";
import { isSupportedMediaFile, uploadMediaAsset } from "./media-upload";
import styles from "../crm.module.css";
import { useCrmToast } from "../use-crm-toast";

const { Dragger } = Upload;
const { Paragraph, Text, Title } = Typography;

export default function MediaStudioView({
  items,
  onRefresh
}: {
  items: MediaItem[];
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const toast = useCrmToast();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [altText, setAltText] = useState("");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const latestItem = useMemo(() => items[0] ?? null, [items]);
  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) =>
      [item.altText, item.id, item.storageKey, item.mimeType].some((value) => value?.toLowerCase().includes(query))
    );
  }, [items, search]);

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card bordered={false} className={styles.heroCard}>
        <div className={styles.heroGrid}>
          <Space direction="vertical" size={16}>
            <Tag className={styles.eyebrowTag}>Shared media library</Tag>
            <Title className={styles.heroHeadline} style={{ fontSize: "clamp(2rem, 2.5vw, 3rem)" }}>
              Upload once, reuse everywhere across the launch site.
            </Title>
            <Paragraph className={styles.heroDescription}>
              Media uploaded here can be assigned to packages, testimonials, doctors, gallery entries, and homepage
              sections without leaving the unified control panel.
            </Paragraph>
          </Space>

          <div className={styles.heroMiniGrid}>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Assets</span>
              <span className={styles.miniValue}>{items.length}</span>
              <span className={styles.miniText}>Images currently available in the shared library.</span>
            </div>
            <div className={styles.miniPanel}>
              <span className={styles.miniLabel}>Latest upload</span>
              <span className={styles.miniValue} style={{ fontSize: "1.35rem" }}>
                {latestItem ? latestItem.id.slice(0, 8) : "None"}
              </span>
              <span className={styles.miniText}>Keep asset names and alt text clear for editors.</span>
            </div>
          </div>
        </div>
      </Card>

      <Card bordered={false} className={styles.surfaceCard} extra={onRefresh ? <Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button> : null}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Upload media</h3>
            <p className={styles.sectionSubtitle}>Add a new image asset and make it immediately available to content editors.</p>
          </div>
        </div>

        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Paragraph className={styles.mutedText} style={{ marginBottom: 0 }}>
            Upload launch assets to the shared library, then assign them inside packages, testimonials, doctors, gallery,
            and homepage sections.
          </Paragraph>
          <Dragger
            accept="image/*"
            multiple={false}
            fileList={fileList}
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => {
              setFileList([]);
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Drop an image here or click to select a file</p>
            <p className="ant-upload-hint">PNG, JPG, WEBP, or other web-safe image formats.</p>
          </Dragger>

          <div>
            <Text strong>Alt text</Text>
            <Input
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe the image for editors and accessibility."
              style={{ marginTop: 8 }}
            />
          </div>

          <Space wrap>
            <Button
              type="primary"
              loading={submitting}
              onClick={async () => {
                const rawFile = fileList[0]?.originFileObj;
                if (!rawFile) {
                  toast.error("Upload blocked", "Choose an image before uploading.");
                  return;
                }
                if (!isSupportedMediaFile(rawFile)) {
                  toast.error("Unsupported image", "Only JPEG, PNG, and WEBP images are supported.");
                  return;
                }

                setSubmitting(true);
                try {
                  const asset = await uploadMediaAsset(rawFile, altText);
                  toast.success("Image uploaded", `Asset ${asset.id}`);
                  setFileList([]);
                  setAltText("");
                  onRefresh?.();
                  router.refresh();
                } catch (error) {
                  toast.error("Upload failed", error instanceof Error ? error.message : "Upload failed.");
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              Upload image
            </Button>
            {latestItem ? <Tag className={styles.pill} color="green">Latest asset: {latestItem.id.slice(0, 8)}</Tag> : null}
          </Space>
        </Space>
      </Card>

      <Card bordered={false} className={styles.surfaceCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h3 className={styles.sectionTitle}>Asset library</h3>
            <p className={styles.sectionSubtitle}>Browse uploaded media and copy asset ids when needed.</p>
          </div>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by alt text, id, file key, or type"
          style={{ marginBottom: 16 }}
        />

        <Table
          rowKey="id"
          dataSource={filteredItems}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 960 }}
          columns={[
            {
              title: "Preview",
              dataIndex: "url",
              key: "preview",
              width: 120,
              render: (_, item) => (
                <Image
                  src={item.url}
                  alt={item.altText || item.id}
                  width={72}
                  height={72}
                  style={{ borderRadius: 14, objectFit: "cover" }}
                />
              )
            },
            {
              title: "Asset",
              key: "asset",
              render: (_, item) => (
                <Space direction="vertical" size={2}>
                  <Text strong>{item.altText || "Untitled image"}</Text>
                  <Text className={styles.mutedText}>{item.id}</Text>
                </Space>
              )
            },
            {
              title: "Type",
              dataIndex: "mimeType",
              key: "mimeType",
              render: (value) => <Tag className={styles.pill}>{value}</Tag>
            },
            {
              title: "Dimensions",
              key: "dimensions",
              render: (_, item) => (item.width && item.height ? `${item.width} × ${item.height}` : "Unknown")
            },
            {
              title: "Created",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (value) => formatDateTime(value)
            },
            {
              title: "Use",
              key: "copy",
              width: 220,
              render: (_, item) => (
                <Space wrap>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={async () => {
                      await navigator.clipboard.writeText(item.id);
                      toast.success("Media id copied", "You can paste this asset into any image selector.");
                    }}
                  >
                    Copy id
                  </Button>
                  <Button
                    onClick={async () => {
                      await navigator.clipboard.writeText(item.url);
                      toast.success("Media URL copied", "The asset URL is now on your clipboard.");
                    }}
                  >
                    Copy URL
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </Space>
  );
}
