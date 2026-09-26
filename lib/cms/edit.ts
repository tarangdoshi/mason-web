import { createDataAttribute } from "next-sanity";
import { sanityDataset, sanityProjectId } from "../../sanity/env";

/* `data-sanity` attributes let Sanity's Presentation view know which document
   controls each part of the page ("Documents on this page", click-to-edit).
   They are only rendered while previewing drafts, so the public website's HTML
   is unchanged. Contains only the public project ID and dataset. */

export type EditTarget = { id: string; type: string; path?: string };

export const STUDIO_BASE_PATH = "/crm/content";

export function sanityEditAttribute({ id, type, path }: EditTarget): string {
  return createDataAttribute({ baseUrl: STUDIO_BASE_PATH, projectId: sanityProjectId, dataset: sanityDataset, id, type, ...(path ? { path } : {}) }).toString();
}

/** Attributes to spread onto an element: empty unless editing is on. */
export function editProps(enabled: boolean, target: EditTarget): { "data-sanity"?: string } {
  return enabled ? { "data-sanity": sanityEditAttribute(target) } : {};
}

/** Documents that back the public site (fixed IDs). */
export const DOCS = {
  homepage: { id: "homepage", type: "homepage" },
  about: { id: "aboutPage", type: "aboutPage" },
  packagesPage: { id: "packagesPage", type: "packagesPage" },
  faqs: { id: "faqs", type: "faqs" },
  gallery: { id: "gallery", type: "gallery" },
  settings: { id: "siteSettings", type: "siteSettings" },
  package: (code: string) => ({ id: `package-${code}`, type: "package" })
} as const;
