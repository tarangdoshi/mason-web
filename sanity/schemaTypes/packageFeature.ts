import { defineField, defineType } from "sanity";
import { imageField, legacy } from "./fields";

/* One document per installed component. Both packages reference these. The
   key and quantity define the approved physical kit; editors can still change
   the customer-facing name, description and photo. */
export const packageFeature = defineType({
  name: "packageFeature",
  title: "Package Component",
  type: "document",
  fields: [
    defineField({ name: "label", title: "Component name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "quantity", title: "Quantity included (fixed)", type: "number", readOnly: true, description: "Part of the approved physical kit. Request a product change rather than editing this number.", validation: (rule) => rule.integer().min(0) }),
    defineField({ name: "category", title: "Category", type: "string", description: "Small label above the name, e.g. Grab support." }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3 }),
    imageField("image", "Photo", "landscape", { description: "Shown as a small thumbnail in the component list." }),
    defineField({
      name: "key",
      title: "Component ID",
      type: "string",
      readOnly: true,
      description: "Fixed identifier used by the public package mapping. It cannot be changed in normal content editing.",
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
