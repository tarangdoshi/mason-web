"use client";

import type { MediaItem } from "./content-studio";

export const SUPPORTED_MEDIA_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function isSupportedMediaFile(file: File) {
  return SUPPORTED_MEDIA_UPLOAD_TYPES.includes(file.type as (typeof SUPPORTED_MEDIA_UPLOAD_TYPES)[number]);
}

export async function uploadMediaAsset(file: File, altText: string) {
  const dataBase64 = await fileToDataUrl(file);
  const response = await fetch("/crm/api/content/media", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "image/jpeg",
      dataBase64,
      altText,
      width: null,
      height: null
    })
  });

  const payload = (await response.json().catch(() => null)) as { data?: MediaItem; error?: string } | null;
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error || "Upload failed.");
  }

  return payload.data;
}
