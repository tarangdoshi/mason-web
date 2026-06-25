import { defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";

export const doctor = defineType({
  name: "doctor",
  title: "Doctor",
  type: "document",
  fields: [
    defineField({ name: "name", title: "Doctor name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "specialty", title: "Specialty / credentials", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "registration", title: "Registration / experience", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "experienceLabel", title: "Experience label", type: "string" }),
    defineField({ name: "quote", title: "Quote", type: "text", rows: 5, validation: (rule) => rule.required() }),
    defineGuidedImageField({ name: "photo", title: "Photo", spec: cmsImageSpecs.portrait, description: "Portrait card image." }),
    defineField({ name: "isFeatured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number", initialValue: 0 })
  ],
  preview: {
    select: { title: "name", subtitle: "specialty" }
  }
});
