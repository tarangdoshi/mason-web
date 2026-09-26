import { defineField, type FieldDefinition } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";

/* Shared, founder-facing field builders. Wording here is what the founder sees
   in Studio, so it avoids implementation terms. */

/** Heading text + the words shown in the green italic accent style. */
export function headingFields(options: { name?: string; highlightsName?: string; title?: string; group?: string; fieldset?: string } = {}): FieldDefinition[] {
  const { name = "heading", highlightsName = "headingHighlights", title = "Heading", group, fieldset } = options;
  return [
    defineField({
      name,
      title,
      type: "text",
      rows: 2,
      description: "Press Enter to start a new line where the design shows one.",
      ...(group ? { group } : {}),
      ...(fieldset ? { fieldset } : {})
    }),
    defineField({
      name: highlightsName,
      title: "Highlighted words",
      type: "array",
      of: [{ type: "string" }],
      description:
        "Words from the heading shown in the accent style. Type them exactly as they appear in the heading. If a word appears twice, the last one is highlighted.",
      ...(group ? { group } : {}),
      ...(fieldset ? { fieldset } : {})
    })
  ];
}

type ImageSpecName = keyof typeof cmsImageSpecs;

/** One high-quality master image (the site creates every size it needs). */
export function imageField(name: string, title: string, spec: ImageSpecName, extra: { description?: string; group?: string; fieldset?: string } = {}) {
  const field = defineGuidedImageField({
    name,
    title,
    spec: cmsImageSpecs[spec],
    description: [
      "Upload one high-resolution image — the website makes the right size for phones, tablets and desktops.",
      "Click the crop icon to set the focal point; it stays in view on every screen.",
      extra.description
    ]
      .filter(Boolean)
      .join(" ")
  });
  return { ...field, ...(extra.group ? { group: extra.group } : {}), ...(extra.fieldset ? { fieldset: extra.fieldset } : {}) };
}

/** Optional separate crop for phones — only where one image cannot suit both. */
export function mobileOverrideField(name: string, title = "Mobile image override (optional)", extra: { group?: string; fieldset?: string } = {}) {
  const field = defineGuidedImageField({
    name,
    title,
    spec: cmsImageSpecs.portrait,
    description:
      "Leave empty in most cases — the main image is used on phones too. Only add one when phones need a different crop (for example a tall portrait version)."
  });
  return { ...field, ...(extra.group ? { group: extra.group } : {}), ...(extra.fieldset ? { fieldset: extra.fieldset } : {}) };
}

/** Fields kept for existing data but no longer shown on the website. */
export function legacy<T extends FieldDefinition>(field: T): T {
  return { ...field, hidden: true, validation: undefined } as T;
}

export const plainList = (name: string, title: string, description?: string, extra: { group?: string; fieldset?: string } = {}) =>
  defineField({ name, title, type: "array", of: [{ type: "string" }], ...(description ? { description } : {}), ...extra });
