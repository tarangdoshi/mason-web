import { defineField, defineType } from "sanity";

export const packageFeature = defineType({
  name: "packageFeature",
  title: "Package feature",
  type: "document",
  fields: [
    defineField({ name: "key", title: "Feature key", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "label", title: "Label", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    defineField({ name: "benefits", title: "Benefits", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number", initialValue: 0 })
  ],
  preview: {
    select: { title: "label", subtitle: "key" }
  }
});
