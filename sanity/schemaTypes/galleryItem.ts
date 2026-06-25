import { defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";

export const galleryItem = defineType({
  name: "galleryItem",
  title: "Gallery item",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "caption", title: "Caption", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineGuidedImageField({
      name: "beforeImage",
      title: "Before image",
      spec: { ...cmsImageSpecs.landscape, matchingField: "afterImage" },
      description: "Before side of the transformation comparison."
    }),
    defineGuidedImageField({
      name: "afterImage",
      title: "After image",
      spec: { ...cmsImageSpecs.landscape, matchingField: "beforeImage" },
      description: "After side of the transformation comparison."
    }),
    defineField({ name: "tags", title: "Tags", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number", initialValue: 0 })
  ],
  preview: {
    select: { title: "title", subtitle: "caption" }
  }
});
