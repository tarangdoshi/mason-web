import { defineArrayMember, defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";

export const imageWithAlt = defineType({
  name: "imageWithAlt",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({ name: "caption", title: "Caption", type: "string" }),
    defineField({
      name: "fallbackSrc",
      title: "Fallback local image path",
      type: "string",
      description: "Used during migration before the image is uploaded to Sanity."
    }),
    defineField({ name: "label", title: "Label", type: "string" }),
    defineField({ name: "objectPosition", title: "Object position", type: "string" })
  ]
});

export const sectionHeader = defineType({
  name: "sectionHeader",
  title: "Section header",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
    defineField({ name: "title", title: "Title", type: "string" }),
    defineField({ name: "subtitle", title: "Subtitle", type: "text", rows: 3 })
  ]
});

export const ctaFields = defineType({
  name: "ctaFields",
  title: "CTA",
  type: "object",
  fields: [
    defineField({ name: "label", title: "Label", type: "string" }),
    defineField({ name: "href", title: "Href", type: "string" })
  ]
});

export const faqItem = defineType({
  name: "faqItem",
  title: "FAQ item",
  type: "object",
  fields: [
    defineField({ name: "question", title: "Question", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "answer", title: "Answer", type: "text", rows: 4, validation: (rule) => rule.required() })
  ]
});

export const processStep = defineType({
  name: "processStep",
  title: "Process step",
  type: "object",
  fields: [
    defineField({ name: "id", title: "ID", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: "badge",
      title: "Badge",
      type: "string",
      options: { list: ["MANDATORY", "INCLUDED", "ADD_ON"] }
    }),
    defineGuidedImageField({
      name: "visual",
      title: "Visual",
      spec: cmsImageSpecs.process,
      description: "Landscape media for a process step."
    })
  ]
});

export const evidenceCard = defineType({
  name: "evidenceCard",
  title: "Evidence card",
  type: "object",
  fields: [
    defineField({ name: "id", title: "ID", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "kicker", title: "Kicker", type: "string" }),
    defineField({ name: "value", title: "Value", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "label", title: "Label", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: "context", title: "Context", type: "text", rows: 3 }),
    defineField({ name: "sourceLabel", title: "Source label", type: "string" }),
    defineField({ name: "sourceId", title: "Source ID", type: "string" }),
    defineField({ name: "ctaLabel", title: "CTA label", type: "string" }),
    defineField({ name: "ctaHref", title: "CTA href", type: "string" })
  ]
});

export const seoFields = defineType({
  name: "seoFields",
  title: "Search metadata",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Search title",
      type: "string",
      description: "Suggested page title for Google and social previews."
    }),
    defineField({
      name: "description",
      title: "Search description",
      type: "text",
      rows: 3,
      description: "Suggested page description for Google and social previews."
    }),
    defineGuidedImageField({
      name: "image",
      title: "Social preview image",
      spec: cmsImageSpecs.social,
      description: "Used for search and social sharing previews."
    })
  ]
});

export const stringList = defineArrayMember({ type: "string" });
