import { createDataAttribute } from "next-sanity";
import { sanityDataset, sanityProjectId } from "../../sanity/env";

/* `data-sanity` attributes let Sanity's Presentation view know which document
   controls each part of the page ("Documents on this page", click-to-edit).
   They are only rendered while previewing drafts, so the public website's HTML
   is unchanged. Contains only the public project ID and dataset. */

/** Sanity requires a field path for every marker; it is where Studio opens. */
export type EditTarget = { id: string; type: string; path: string };

export const STUDIO_BASE_PATH = "/crm/content";

export function sanityEditAttribute({ id, type, path }: EditTarget): string {
  return createDataAttribute({ baseUrl: STUDIO_BASE_PATH, projectId: sanityProjectId, dataset: sanityDataset, id, type, path }).toString();
}

/** Attributes to spread onto an element: empty unless editing is on. An
    editor-only aid, so it never throws — a bad marker must not break preview. */
export function editProps(enabled: boolean, target: EditTarget): { "data-sanity"?: string } {
  if (!enabled) return {};
  try {
    return { "data-sanity": sanityEditAttribute(target) };
  } catch {
    return {};
  }
}

/** Documents that back the public site (fixed IDs). */
/** Documents that back the public site (fixed IDs), each with the field Studio
    opens by default; callers may point `path` at a more specific field. */
export const DOCS = {
  homepage: { id: "homepage", type: "homepage", path: "hero" },
  about: { id: "aboutPage", type: "aboutPage", path: "hero" },
  packagesPage: { id: "packagesPage", type: "packagesPage", path: "heading" },
  faqs: { id: "faqs", type: "faqs", path: "items" },
  gallery: { id: "gallery", type: "gallery", path: "tiles" },
  settings: { id: "siteSettings", type: "siteSettings", path: "supportEmail" },
  package: (code: string) => ({ id: `package-${code}`, type: "package", path: "bestFor" })
} as const;
