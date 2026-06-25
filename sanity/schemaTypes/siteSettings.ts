import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "brandName", title: "Brand name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "serviceLine", title: "Service line", type: "string" }),
    defineField({ name: "phoneDisplay", title: "Phone display", type: "string" }),
    defineField({ name: "phoneTel", title: "Phone tel", type: "string" }),
    defineField({ name: "whatsappLabel", title: "WhatsApp label", type: "string" }),
    defineField({ name: "whatsappUrl", title: "WhatsApp URL", type: "url" }),
    defineField({ name: "trustBadges", title: "Trust badges", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "homepageSeo", title: "Homepage search metadata", type: "seoFields" }),
    defineField({ name: "comparePackagesSeo", title: "Compare packages search metadata", type: "seoFields" }),
    defineField({ name: "refundLanguage", title: "Refund language", type: "text", rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: "doctorDisclaimer", title: "Doctor disclaimer", type: "text", rows: 3, validation: (rule) => rule.required() })
  ],
  preview: {
    select: { title: "brandName", subtitle: "serviceLine" }
  }
});
