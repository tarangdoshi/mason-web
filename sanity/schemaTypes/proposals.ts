import { defineArrayMember, defineField, defineType } from "sanity";
import { PROPOSAL_COMPONENT_KEYS, proposalComponentName } from "../../lib/proposals/components";
import { imageField } from "./fields";

/* Proposal Builder v1 (Phase 1, dark behind NEXT_PUBLIC_PROPOSALS_ENABLED).
   componentLibrary: one document per approved component, fixed ID `componentLibrary-<key>`.
   proposalTemplate: one document per template version, fixed ID `proposalTemplate-<version>`.
   Both are created by `pnpm proposals:seed`; Studio cannot create, duplicate or delete them. */

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
      validation: (rule) => rule.required().max(140).custom(nonEmpty("Benefit line"))
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

const step = defineArrayMember({
  type: "object",
  name: "proposalStep",
  title: "Step",
  fields: [
    defineField({ name: "title", title: "Step title", type: "string", validation: (rule) => rule.required().custom(nonEmpty("Step title")) }),
    defineField({ name: "body", title: "Step detail", type: "text", rows: 2 })
  ],
  preview: { select: { title: "title", subtitle: "body" } }
});

export const proposalTemplate = defineType({
  name: "proposalTemplate",
  title: "Proposal template",
  type: "document",
  groups: [
    { name: "page", title: "Page copy", default: true },
    { name: "terms", title: "Payment & next steps" },
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
      name: "pageCopy",
      title: "Page copy",
      type: "object",
      group: "page",
      options: { collapsible: false },
      fields: [
        defineField({ name: "eyebrow", title: "Eyebrow", type: "string" }),
        defineField({ name: "headline", title: "Headline", type: "string", description: "Use {name} where the customer’s display name goes.", validation: (rule) => rule.required().custom(nonEmpty("Headline")) }),
        defineField({ name: "intro", title: "Introduction", type: "text", rows: 3, validation: (rule) => rule.required().custom(nonEmpty("Introduction")) }),
        defineField({ name: "assessmentSummaryHeading", title: "Assessment summary heading", type: "string" }),
        defineField({ name: "recommendedLabel", title: "Label: recommended", type: "string", initialValue: "Recommended" }),
        defineField({ name: "presentLabel", title: "Label: already present", type: "string", initialValue: "Already present" }),
        defineField({ name: "declinedLabel", title: "Label: declined", type: "string", initialValue: "Not needed" }),
        defineField({ name: "complimentaryLabel", title: "Label: complimentary", type: "string", initialValue: "Complimentary" }),
        defineField({ name: "essentialTitle", title: "Option title: Essential", type: "string", validation: (rule) => rule.required().custom(nonEmpty("Essential title")) }),
        defineField({ name: "essentialSummary", title: "Option summary: Essential", type: "text", rows: 2 }),
        defineField({ name: "addonTitle", title: "Option title: Essential + Add-on", type: "string", validation: (rule) => rule.required().custom(nonEmpty("Add-on title")) }),
        defineField({ name: "addonSummary", title: "Option summary: Essential + Add-on", type: "text", rows: 2 }),
        defineField({ name: "otherRoomsLine", title: "Other rooms line", type: "string", initialValue: "Other rooms: quoted after inspection.", validation: (rule) => rule.required().custom(nonEmpty("Other rooms line")) }),
        defineField({ name: "closing", title: "Closing line", type: "text", rows: 2 })
      ]
    }),
    defineField({
      name: "paymentTerms",
      title: "Payment terms",
      type: "array",
      group: "terms",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1)
    }),
    defineField({ name: "whatHappensNext", title: "What happens next", type: "array", group: "terms", of: [step], validation: (rule) => rule.required().min(1) }),
    defineField({
      name: "disclaimer",
      title: "Disclaimer",
      type: "text",
      rows: 5,
      group: "legal",
      description: "Required. A proposal template cannot be published without it.",
      validation: (rule) => rule.required().custom(nonEmpty("Disclaimer"))
    })
  ],
  preview: { select: { title: "version", subtitle: "pageCopy.headline" }, prepare: ({ title, subtitle }) => ({ title: `Proposal template ${title ?? ""}`.trim(), subtitle }) }
});

export const proposalSchemaTypes = [componentLibrary, proposalTemplate];
export const proposalDocumentTypes = new Set(["componentLibrary", "proposalTemplate"]);
