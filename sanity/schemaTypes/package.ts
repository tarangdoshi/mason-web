import { defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";
import { legacy, plainList } from "./fields";

/* Standard and Advanced. Their identity and shared physical kit are fixed;
   presentation copy and commercial prices remain editable. */

const MIN_PRICE = 1000;
const MAX_PRICE = 10_000_000;

const priceRule = (rule: import("sanity").NumberRule) => rule.integer().min(MIN_PRICE).max(MAX_PRICE);

export const packageSchema = defineType({
  name: "package",
  title: "Package",
  type: "document",
  groups: [
    { name: "content", title: "Package", default: true },
    { name: "price", title: "Commercial pricing — review before publishing" },
    { name: "components", title: "Included kit (fixed)" }
  ],
  fields: [
    defineField({ name: "name", title: "Package name", type: "string", readOnly: true, group: "content", description: "Fixed — the name is used by analytics and the CRM." }),
    defineField({ name: "code", title: "Package code", type: "string", readOnly: true, hidden: true }),
    defineField({ name: "badge", title: "Badge", type: "string", group: "content", description: "Short label, e.g. “2-Year Safety AMC Included”." }),
    defineField({ name: "titleDescriptor", title: "Short descriptor", type: "string", group: "content" }),
    defineField({
      name: "bestFor",
      title: "Description",
      type: "text",
      rows: 3,
      group: "content",
      description: "Shown under the price on the cards and package page."
    }),
    defineField({ name: "outcome", title: "Outcome line", type: "text", rows: 2, group: "content" }),
    defineField({ name: "isFeatured", title: "Show the “Most popular” badge", type: "boolean", group: "content" }),
    plainList("visualHighlights", "Highlight chips", "Short phrases shown on the package page.", { group: "content" }),
    defineField({
      name: "priceInr",
      title: "Price (₹)",
      type: "number",
      group: "price",
      description:
        "Commercial/business information. Numbers only, e.g. 29999. This value reaches cards, package pages, checkout and analytics. Review changes before publishing; the team confirms the final amount before sending a payment link.",
      validation: (rule) => priceRule(rule).required()
    }),
    defineField({
      name: "referencePriceInr",
      title: "Struck-through price (₹)",
      type: "number",
      group: "price",
      description: "Commercial/business information. Optional. Shown crossed out next to the price; it must exceed the selling price. Review changes before publishing.",
      validation: (rule) =>
        priceRule(rule).custom((value, context) => {
          const price = (context.document as { priceInr?: number } | undefined)?.priceInr;
          if (typeof value !== "number" || typeof price !== "number") return true;
          return value > price ? true : "The struck-through price must be higher than the price.";
        })
    }),
    defineField({
      name: "includedFeatures",
      title: "Shared 13-component kit (fixed)",
      type: "array",
      group: "components",
      readOnly: true,
      description: "Standard and Advanced share the approved physical kit. Edit customer-facing component names, descriptions and photos under Package Components; request a product change to alter inclusions.",
      of: [{ type: "reference", to: [{ type: "packageFeature" }] }]
    }),
    legacy(defineField({ name: "ctaLabel", title: "CTA label", type: "string" })),
    legacy(defineField({ name: "savings", title: "Savings / tier label", type: "string" })),
    legacy(defineField({ name: "summary", title: "Summary", type: "text" })),
    legacy(defineField({ name: "priceLabel", title: "Price label", type: "string" })),
    legacy(defineField({ name: "referencePrice", title: "Reference price (old text field)", type: "string" })),
    legacy(defineField({ name: "currentPrice", title: "Current price (old text field)", type: "string" })),
    legacy(defineField({ name: "followUpLabel", title: "Included follow-up", type: "string" })),
    legacy(defineField({ name: "sortOrder", title: "Sort order", type: "number" })),
    legacy(defineGuidedImageField({ name: "visual", title: "Visual", spec: cmsImageSpecs.package })),
    legacy(defineField({ name: "availableAddOns", title: "Available add-ons", type: "array", of: [{ type: "reference", to: [{ type: "packageFeature" }] }] }))
  ],
  preview: {
    select: { title: "name", price: "priceInr" },
    prepare: ({ title, price }) => ({ title, subtitle: typeof price === "number" ? `₹${price.toLocaleString("en-IN")}` : undefined })
  }
});
