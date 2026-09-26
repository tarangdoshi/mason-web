import { defineField, defineType } from "sanity";
import { imageField, legacy } from "./fields";

export const doctor = defineType({
  name: "doctor",
  title: "Doctor / Expert",
  type: "document",
  orderings: [{ title: "Website order", name: "websiteOrder", by: [{ field: "sortOrder", direction: "asc" }] }],
  fields: [
    defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "specialty", title: "Credentials", type: "string", description: "e.g. MBBS, MD", validation: (rule) => rule.required() }),
    defineField({ name: "registration", title: "Experience / specialty line", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "quote", title: "Quote", type: "text", rows: 5, validation: (rule) => rule.required() }),
    imageField("photo", "Photo", "portrait", { description: "Shown as a small round portrait; set the focal point on the face." }),
    defineField({ name: "sortOrder", title: "Order on website", type: "number", description: "Lower numbers appear first.", initialValue: 0 }),
    defineField({ name: "isHidden", title: "Hide from website", type: "boolean", initialValue: false }),
    legacy(defineField({ name: "experienceLabel", title: "Experience label", type: "string" })),
    legacy(defineField({ name: "isFeatured", title: "Featured", type: "boolean" }))
  ],
  preview: {
    select: { title: "name", subtitle: "specialty", media: "photo", hidden: "isHidden" },
    prepare: ({ title, subtitle, media, hidden }) => ({ title, media, subtitle: hidden ? `${subtitle ?? ""} — Hidden` : subtitle })
  }
});
