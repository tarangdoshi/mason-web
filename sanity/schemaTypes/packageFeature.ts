import { defineField, defineType } from "sanity";
import { imageField, legacy } from "./fields";

/* One document per installed component. Both packages reference these, so a
   name, quantity or photo change here shows on both at once. */
export const packageFeature = defineType({
  name: "packageFeature",
  title: "Package Component",
  type: "document",
  fields: [
    defineField({ name: "label", title: "Component name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "quantity", title: "Quantity included", type: "number", validation: (rule) => rule.integer().min(0) }),
    defineField({ name: "category", title: "Category", type: "string", description: "Small label above the name, e.g. Grab support." }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    imageField("image", "Photo", "landscape", { description: "Shown as a small thumbnail in the component list." }),
    defineField({
      name: "key",
      title: "Component ID",
      type: "string",
      description: "Set once when the component is created, e.g. extra-grab-bar (lowercase, dashes). Do not change it afterwards.",
      validation: (rule) => rule.required().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { name: "lowercase-with-dashes" })
    }),
    legacy(defineField({ name: "publicLabel", title: "Public label", type: "string" })),
    legacy(defineField({ name: "publicDescription", title: "Public description", type: "text" })),
    legacy(defineField({ name: "benefits", title: "Benefits", type: "array", of: [{ type: "string" }] })),
    legacy(defineField({ name: "sortOrder", title: "Sort order", type: "number" }))
  ],
  preview: {
    select: { title: "label", quantity: "quantity", media: "image" },
    prepare: ({ title, quantity, media }) => ({ title, subtitle: typeof quantity === "number" ? `Quantity: ${quantity}` : undefined, media })
  }
});
