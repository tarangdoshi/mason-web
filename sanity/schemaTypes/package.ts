import { defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";

const lockedPackageNames = ["Standard", "Advanced"];
const lockedPackageCodes = ["package-standard", "package-advanced"];
const expectedPackageNamesByCode: Record<string, string> = {
  "package-standard": "Standard",
  "package-advanced": "Advanced"
};

export const packageSchema = defineType({
  name: "package",
  title: "Package",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Package code",
      type: "string",
      options: { list: lockedPackageCodes },
      validation: (rule) =>
        rule
          .required()
          .custom((value, context) => {
            if (!value || !lockedPackageCodes.includes(value)) {
              return "Use package-standard or package-advanced.";
            }
            const packageName = context.document?.name;
            if (typeof packageName === "string" && expectedPackageNamesByCode[value] !== packageName) {
              return `${value} must use the ${expectedPackageNamesByCode[value]} package name.`;
            }
            return true;
          })
    }),
    defineField({
      name: "name",
      title: "Package name",
      type: "string",
      options: { list: lockedPackageNames },
      validation: (rule) =>
        rule
          .required()
          .custom((value, context) => {
            if (!value || !lockedPackageNames.includes(value)) {
              return "Package name must be Standard or Advanced.";
            }
            const packageCode = context.document?.code;
            if (typeof packageCode === "string" && expectedPackageNamesByCode[packageCode] !== value) {
              return `${value} must use the ${value === "Standard" ? "package-standard" : "package-advanced"} package code.`;
            }
            return true;
          })
    }),
    defineField({ name: "badge", title: "Badge", type: "string" }),
    defineField({ name: "titleDescriptor", title: "Title descriptor", type: "string" }),
    defineField({ name: "bestFor", title: "Best for", type: "text", rows: 3 }),
    defineField({ name: "outcome", title: "Outcome", type: "text", rows: 3 }),
    defineField({ name: "summary", title: "Summary", type: "text", rows: 3 }),
    defineField({ name: "ctaLabel", title: "CTA label", type: "string" }),
    defineField({ name: "priceLabel", title: "Price label", type: "string" }),
    defineField({ name: "savings", title: "Savings / tier label", type: "string" }),
    defineField({ name: "isFeatured", title: "Featured", type: "boolean", initialValue: false }),
    defineField({ name: "sortOrder", title: "Sort order", type: "number", initialValue: 0 }),
    defineGuidedImageField({
      name: "visual",
      title: "Visual",
      spec: cmsImageSpecs.package,
      description: "Used on package cards and checkout summaries. Keep important detail near the focal point."
    }),
    defineField({ name: "visualHighlights", title: "Visual highlights", type: "array", of: [{ type: "string" }] }),
    defineField({
      name: "includedFeatures",
      title: "Included features",
      type: "array",
      of: [{ type: "reference", to: [{ type: "packageFeature" }] }]
    }),
    defineField({
      name: "availableAddOns",
      title: "Available add-ons",
      type: "array",
      of: [{ type: "reference", to: [{ type: "packageFeature" }] }]
    })
  ],
  preview: {
    select: { title: "name", subtitle: "code" }
  }
});
