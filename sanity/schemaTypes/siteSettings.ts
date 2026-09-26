import { defineField, defineType } from "sanity";
import { headingFields, imageField, legacy } from "./fields";

/* "Contact & Support": the customer-facing contact details used everywhere on
   the site (header, footer, contact page, legal pages), plus footer and
   contact-page wording. Where Mason operates (Goa) is not here: it is tied to
   how enquiries are classified, so it stays in code. */

const indianMobile = /^(\+?91[\s-]?)?0?[6-9]\d{4}[\s-]?\d{5}$/;

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Contact & Support",
  type: "document",
  groups: [
    { name: "contact", title: "Contact details", default: true },
    { name: "footer", title: "Footer" },
    { name: "contactPage", title: "Contact page" },
    { name: "other", title: "Other" }
  ],
  fields: [
    defineField({
      name: "supportEmail",
      title: "Support email",
      type: "string",
      group: "contact",
      validation: (rule) => rule.required().email()
    }),
    defineField({ name: "supportHours", title: "Support hours", type: "string", group: "contact", description: "e.g. Monday to Friday, 10 am to 7 pm", validation: (rule) => rule.required() }),
    defineField({
      name: "phoneDisplay",
      title: "Phone number (as shown)",
      type: "string",
      group: "contact",
      description: "How the number is written on the site, e.g. +91 81494 33383.",
      validation: (rule) => rule.required().custom((value) => (typeof value === "string" && indianMobile.test(value.trim()) ? true : "Enter a 10-digit Indian mobile number, optionally with +91."))
    }),
    defineField({
      name: "phoneTel",
      title: "Phone number (for tap-to-call)",
      type: "string",
      group: "contact",
      description: "The same number without spaces, e.g. +918149433383.",
      validation: (rule) => rule.required().custom((value) => (typeof value === "string" && indianMobile.test(value.trim()) ? true : "Enter a 10-digit Indian mobile number, optionally with +91."))
    }),
    defineField({
      name: "whatsappUrl",
      title: "WhatsApp link",
      type: "url",
      group: "contact",
      description: "e.g. https://wa.me/918149433383",
      validation: (rule) => rule.required().uri({ scheme: ["https"] }).custom((value) => (typeof value === "string" && /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(value) ? true : "Use a wa.me link, e.g. https://wa.me/918149433383"))
    }),
    ...headingFields({ name: "footerHeading", highlightsName: "footerHeadingHighlights", title: "Footer heading", group: "footer" }),
    defineField({ name: "footerCtaLabel", title: "Footer button label", type: "string", group: "footer", description: "Opens the free-inspection booking form." }),
    defineField({ name: "footerTagline", title: "Footer description", type: "text", rows: 3, group: "footer" }),
    defineField({ name: "contactEyebrow", title: "Small label above the heading", type: "string", group: "contactPage" }),
    ...headingFields({ name: "contactHeading", highlightsName: "contactHeadingHighlights", group: "contactPage" }),
    defineField({ name: "contactIntro", title: "Supporting text", type: "text", rows: 3, group: "contactPage" }),
    { ...imageField("contactImage", "Photo", "portrait"), group: "contactPage" },
    defineField({ name: "contactCardTitle", title: "Photo caption title", type: "string", group: "contactPage" }),
    defineField({ name: "contactCardBody", title: "Photo caption text", type: "text", rows: 2, group: "contactPage" }),
    defineField({ name: "contactCallLabel", title: "Label for phone", type: "string", group: "contactPage" }),
    defineField({ name: "contactHoursLabel", title: "Label for hours", type: "string", group: "contactPage" }),
    defineField({ name: "contactEmailLabel", title: "Label for email", type: "string", group: "contactPage" }),
    defineField({ name: "doctorDisclaimer", title: "Doctor disclaimer", type: "text", rows: 3, group: "other", description: "Shown under the doctors on the homepage.", validation: (rule) => rule.required() }),
    legacy(defineField({ name: "brandName", title: "Brand name", type: "string" })),
    legacy(defineField({ name: "serviceLine", title: "Service line", type: "string" })),
    legacy(defineField({ name: "whatsappLabel", title: "WhatsApp label", type: "string" })),
    legacy(defineField({ name: "trustBadges", title: "Trust badges", type: "array", of: [{ type: "string" }] })),
    legacy(defineField({ name: "homepageSeo", title: "Homepage search metadata", type: "seoFields" })),
    legacy(defineField({ name: "comparePackagesSeo", title: "Compare packages search metadata", type: "seoFields" })),
    legacy(defineField({ name: "refundLanguage", title: "Refund language", type: "text" }))
  ],
  preview: { prepare: () => ({ title: "Contact & Support" }) }
});
