"use client";

import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Image, Input, Modal, Space, Typography, Upload } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import { useEffect, useMemo, useState } from "react";
import type { MediaItem } from "./content-studio";
import { isSupportedMediaFile, uploadMediaAsset } from "./media-upload";
import { useCrmToast } from "../use-crm-toast";

const { Dragger } = Upload;
const { Text } = Typography;

export default function InlineMediaUpload({
  label,
  onUploaded
}: {
  label: string;
  onUploaded: (asset: MediaItem) => void;
}) {
  const toast = useCrmToast();
  const [open, setOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [altText, setAltText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const rawFile = fileList[0]?.originFileObj ?? null;

  const previewUrl = useMemo(() => (rawFile ? URL.createObjectURL(rawFile) : null), [rawFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function reset() {
    setFileList([]);
    setAltText("");
    setSubmitting(false);
  }

  return (
    <>
      <Button icon={<UploadOutlined />} onClick={() => setOpen(true)}>
        Upload
      </Button>

      <Modal
        open={open}
        title={`Upload ${label}`}
        destroyOnHidden
        onCancel={() => {
          setOpen(false);
          reset();
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setOpen(false);
              reset();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="upload"
            type="primary"
            loading={submitting}
            onClick={async () => {
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
                onUploaded(asset);
                toast.success("Image uploaded", "The asset was added to the media library and assigned.");
                setOpen(false);
                reset();
              } catch (error) {
                toast.error("Upload failed", error instanceof Error ? error.message : "Upload failed.");
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Upload image
          </Button>
        ]}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Text type="secondary">
            Choose an image from your local drive. Uploads are resized automatically to keep page layouts consistent.
          </Text>

          <Dragger
            accept="image/jpeg,image/png,image/webp"
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
            <p className="ant-upload-text">Drop an image here or click to select from your computer</p>
            <p className="ant-upload-hint">JPEG, PNG, and WEBP are supported.</p>
          </Dragger>

          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={rawFile?.name || "Selected image"}
              width={96}
              height={96}
              style={{ borderRadius: 12, objectFit: "cover" }}
              preview={false}
            />
          ) : null}

          <div>
            <Text strong>Alt text</Text>
            <Input
              value={altText}
              onChange={(event) => setAltText(event.target.value)}
              placeholder="Describe the image for editors and accessibility."
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}
