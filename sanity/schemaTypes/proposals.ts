import { defineArrayMember, defineField, defineType } from "sanity";
import { PROPOSAL_COMPONENT_KEYS, proposalComponentName } from "../../lib/proposals/components";
import { imageField } from "./fields";

/** Draft benefit lines awaiting the CMO start with this; such a document cannot be published. */
export const CMO_PLACEHOLDER_PREFIX = "CMO TO WRITE:";

/* Proposal Builder v1 (Phase 1, dark behind NEXT_PUBLIC_PROPOSALS_ENABLED).
   componentLibrary: one document per approved component, fixed ID `componentLibrary-<key>`.
   proposalTemplate: one document per template version, fixed ID `proposalTemplate-<version>`.
   Both are created as drafts by `pnpm proposals:seed`; Studio cannot create, duplicate or delete them. */

const nonEmpty = (label: string) => (value: unknown) =>
  typeof value === "string" && value.trim().length > 0 ? true : `${label} is required and cannot be empty.`;

export const componentLibrary = defineType({
  name: "componentLibrary",
  title: "Proposal component",
  type: "document",
  fields: [
    defineField({
      name: "key",
      title: "Component ID",
      type: "string",
      readOnly: true,
      options: { list: PROPOSAL_COMPONENT_KEYS.map((key) => ({ title: key, value: key })) },
      description: "Fixed identifier shared with the price sheet and the CRM. It cannot be changed.",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "name",
      title: "Component name (approved, exact)",
      type: "string",
      readOnly: true,
      description: "The founder-approved name. It is fixed; request a product change to alter it.",
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const key = (context.document as { key?: string } | undefined)?.key;
          const approved = key ? proposalComponentName(key) : null;
          if (!approved) return "Unknown component ID.";
          return value === approved ? true : `Must read exactly “${approved}”.`;
        })
    }),
    defineField({
      name: "benefitLine",
      title: "Benefit line",
      type: "string",
      description: "One short line the customer reads under the name, e.g. what it prevents.",
      validation: (rule) =>
        rule.required().max(140).custom(nonEmpty("Benefit line")).custom((value) =>
          typeof value === "string" && value.startsWith(CMO_PLACEHOLDER_PREFIX) ? "Still a placeholder: the CMO needs to write this benefit line before publishing." : true).custom(placeholderCheck)
    }),
    defineField({ name: "description", title: "Description", type: "text", rows: 3, validation: (rule) => rule.max(600) }),
    defineField({
      name: "photos",
      title: "Photos",
      type: "array",
      of: [defineArrayMember(imageField("photo", "Photo", "landscape"))],
      validation: (rule) => rule.max(6)
    }),
    imageField("icon", "Icon", "landscape", { description: "Small symbol shown beside the name; keep the symbol centred so it survives a square crop. A simple line icon on a light background works best." }),
    defineField({
      name: "complimentary",
      title: "Complimentary",
      type: "boolean",
      initialValue: false,
      description: "Shown to the customer as included at no charge. Pricing still follows the price sheet’s Complimentary column."
    })
  ],
  preview: {
    select: { title: "name", key: "key", complimentary: "complimentary", media: "icon" },
    prepare: ({ title, key, complimentary, media }) => ({ title, subtitle: [key, complimentary ? "Complimentary" : null].filter(Boolean).join(" · "), media })
  }
});


/** The only placeholders the proposal renderer fills in. Anything else in braces is a typo. */
export const TEMPLATE_PLACEHOLDERS = ["customerName", "date", "essentialPrice", "addonPrice", "addonName"] as const;

export function unknownPlaceholders(value: string): string[] {
  return [...value.matchAll(/\{([^{}]*)\}/g)].map((match) => match[1]).filter((name) => !(TEMPLATE_PLACEHOLDERS as readonly string[]).includes(name));
}

function placeholderCheck(value: unknown) {
  if (typeof value !== "string") return true;
  const unknown = unknownPlaceholders(value);
  return unknown.length ? `Unknown placeholder ${unknown.map((name) => `{${name}}`).join(", ")}. Use only ${TEMPLATE_PLACEHOLDERS.map((name) => `{${name}}`).join(", ")}.` : true;
}

const copy = (name: string, title: string, options: { required?: boolean; text?: boolean; initialValue?: string; description?: string } = {}) =>
  defineField({
    name,
    title,
    type: options.text ? "text" : "string",
    ...(options.text ? { rows: 3 } : {}),
    ...(options.initialValue ? { initialValue: options.initialValue } : {}),
    ...(options.description ? { description: options.description } : {}),
    validation: (rule) => (options.required ? rule.required().custom(nonEmpty(title)).custom(placeholderCheck) : rule.custom(placeholderCheck))
  });

const titledText = (name: string, title: string) =>
  defineArrayMember({
    type: "object",
    name,
    title,
    fields: [copy("title", "Title", { required: true }), copy("body", "Text", { text: true })],
    preview: { select: { title: "title", subtitle: "body" } }
  });

const step = titledText("proposalStep", "Step");

export const proposalTemplate = defineType({
  name: "proposalTemplate",
  title: "Proposal template",
  type: "document",
  groups: [
    { name: "options", title: "Page 1 · Options", default: true },
    { name: "essential", title: "Page 2 · Essential" },
    { name: "addon", title: "Page 3 · Add-on & next steps" },
    { name: "legal", title: "Disclaimer" }
  ],
  fields: [
    defineField({
      name: "version",
      title: "Template version",
      type: "string",
      readOnly: true,
      description: "Stored on every proposal (e.g. v1). A sent proposal keeps its version; make a new version rather than rewriting one in use.",
      validation: (rule) => rule.required().regex(/^v\d+$/, { name: "v<number>" })
    }),
    defineField({
      name: "addonName",
      title: "Add-on package name",
      type: "string",
      group: "options",
      initialValue: "Safety Add-on",
      description: "Fills {addonName} everywhere, e.g. “Safety Add-on” or “Comfort Add-on”. Copy placeholders: {customerName}, {date}, {essentialPrice}, {addonPrice}, {addonName}.",
      validation: (rule) => rule.required().max(40).custom(nonEmpty("Add-on package name"))
    }),
    defineField({
      name: "optionsPage",
      title: "Page 1 · Your options",
      type: "object",
      group: "options",
      options: { collapsible: false },
      fields: [
        copy("headerLabel", "Header label", { required: true }),
        copy("eyebrow", "Eyebrow", { required: true }),
        copy("title", "Title", { required: true }),
        copy("intro", "Introduction", { required: true, text: true }),
        defineField({ name: "reassurances", title: "Reassurances", type: "array", of: [titledText("reassurance", "Reassurance")], validation: (rule) => rule.max(3) }),
        copy("sectionHeading", "Section heading", { required: true }),
        copy("essentialOptionLabel", "Option A label", { required: true }),
        copy("essentialTitle", "Option A title", { required: true }),
        copy("whatYouGetLabel", "“What you get” label", { required: true }),
        defineField({ name: "includedLines", title: "Always-included lines (Option A card)", type: "array", of: [defineArrayMember({ type: "string", validation: (rule) => rule.custom(placeholderCheck) })] }),
        copy("complimentaryLabel", "Complimentary label", { required: true, initialValue: "Complimentary" }),
        copy("addonOptionLabel", "Option B label", { required: true }),
        copy("addonTitle", "Option B title", { required: true }),
        copy("addonBadge", "Option B badge"),
        copy("addonLead", "Option B lead-in", { required: true }),
        copy("addonNote", "Option B note", { text: true }),
        copy("otherRoomsLine", "Other rooms line", { required: true, initialValue: "Other rooms: quoted after inspection." })
      ]
    }),
    defineField({
      name: "essentialPage",
      title: "Page 2 · Essential Package",
      type: "object",
      group: "essential",
      options: { collapsible: false },
      fields: [
        copy("eyebrow", "Eyebrow", { required: true }),
        copy("title", "Title", { required: true }),
        copy("priceSuffix", "Price suffix", { initialValue: "installed" }),
        copy("intro", "Introduction", { required: true, text: true, description: "May be varied per selection by the CMO." }),
        copy("includedHeading", "“Also part of your package” heading", { required: true }),
        defineField({ name: "included", title: "Also part of your package", type: "array", of: [titledText("includedItem", "Included item")] })
      ]
    }),
    defineField({
      name: "addonPage",
      title: "Page 3 · Add-on",
      type: "object",
      group: "addon",
      options: { collapsible: false },
      fields: [
        copy("eyebrow", "Eyebrow", { required: true }),
        copy("title", "Title", { required: true }),
        copy("intro", "Introduction", { required: true, text: true }),
        copy("priceStripEssentialLabel", "Price strip: Essential label", { required: true }),
        copy("priceStripAddonLabel", "Price strip: Add-on label", { required: true })
      ]
    }),
    defineField({ name: "whatHappensNext", title: "What happens next", type: "array", group: "addon", of: [step], validation: (rule) => rule.required().min(1) }),
    { ...copy("paymentHeading", "Payment heading", { required: true, initialValue: "Payment" }), group: "addon" },
    defineField({
      name: "paymentTerms",
      title: "Payment terms",
      type: "array",
      group: "addon",
      of: [defineArrayMember({ type: "string", validation: (rule) => rule.custom(placeholderCheck) })],
      validation: (rule) => rule.required().min(1)
    }),
    { ...copy("closing", "Closing", { text: true }), group: "addon" },
    { ...copy("signoff", "Sign-off"), group: "addon" },
    { ...copy("footer", "Footer", { initialValue: "masoncompany.in" }), group: "addon" },
    defineField({
      name: "disclaimer",
      title: "Disclaimer",
      type: "text",
      rows: 5,
      group: "legal",
      description: "Required. A proposal template cannot be published without it.",
      validation: (rule) => rule.required().custom(nonEmpty("Disclaimer")).custom(placeholderCheck)
    })
  ],
  preview: { select: { title: "version", subtitle: "addonName" }, prepare: ({ title, subtitle }) => ({ title: `Proposal template ${title ?? ""}`.trim(), subtitle }) }
});

export const proposalSchemaTypes = [componentLibrary, proposalTemplate];
export const proposalDocumentTypes = new Set(["componentLibrary", "proposalTemplate"]);
