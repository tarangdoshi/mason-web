import { defineField, defineType } from "sanity";
import { imageField, legacy } from "./fields";

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  orderings: [{ title: "Website order", name: "websiteOrder", by: [{ field: "sortOrder", direction: "asc" }] }],
  fields: [
    defineField({ name: "name", title: "Customer name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "relation", title: "Relation", type: "string", description: "e.g. Daughter, Son" }),
    defineField({ name: "city", title: "Location", type: "string", description: "e.g. Goa" }),
    defineField({ name: "quote", title: "Quote", type: "text", rows: 5, validation: (rule) => rule.required() }),
    imageField("photo", "Photo", "portrait", { description: "Optional." }),
    defineField({ name: "sortOrder", title: "Order on website", type: "number", description: "Lower numbers appear first.", initialValue: 0 }),
    defineField({ name: "isHidden", title: "Hide from website", type: "boolean", initialValue: false }),
    legacy(defineField({ name: "outcomeLine", title: "Outcome line", type: "string" })),
    legacy(defineField({ name: "isFeatured", title: "Featured", type: "boolean" }))
  ],
  preview: {
    select: { title: "name", relation: "relation", city: "city", hidden: "isHidden", media: "photo" },
    prepare: ({ title, relation, city, hidden, media }) => ({ title, media, subtitle: [[relation, city].filter(Boolean).join(" · "), hidden ? "Hidden" : null].filter(Boolean).join(" — ") })
  }
});
