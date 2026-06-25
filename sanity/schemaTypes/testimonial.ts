import { defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Customer name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "relation", title: "Relation", type: "string" }),
    defineField({ name: "city", title: "City", type: "string" }),
    defineField({ name: "quote", title: "Quote", type: "text", rows: 5, validation: (rule) => rule.required() }),
    defineField({ name: "outcomeLine", title: "Outcome line", type: "string" }),
    defineGuidedImageField({ name: "photo", title: "Photo", spec: cmsImageSpecs.portrait, description: "Portrait card image." }),
    defineField({ name: "isFeatured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number", initialValue: 0 })
  ],
  preview: {
    select: { title: "name", subtitle: "relation" }
  }
});
