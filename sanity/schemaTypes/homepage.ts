import { defineArrayMember, defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";
import { headingFields, imageField, legacy, mobileOverrideField, plainList } from "./fields";

/* The homepage, one tab per section in the order visitors see them. FAQs and
   the gallery have their own documents; fields marked legacy are kept for
   existing data but are not shown on the website. */

const section = (name: string, title: string, fields: ReturnType<typeof defineField>[], group: string) =>
  defineField({ name, title, type: "object", group, options: { collapsible: false }, fields });

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "research", title: "Research" },
    { name: "visit", title: "Book-a-visit strip" },
    { name: "why", title: "Why Mason" },
    { name: "packages", title: "Packages preview" },
    { name: "process", title: "How it works" },
    { name: "doctors", title: "Doctors" },
    { name: "testimonials", title: "Testimonials" },
    { name: "finalCta", title: "Final call to action" }
  ],
  fields: [
    section("hero", "Hero", [
      ...headingFields(),
      defineField({ name: "subcopy", title: "Supporting text", type: "text", rows: 3 }),
      defineField({ name: "primaryCta", title: "Main button label", type: "string", description: "Opens the free-inspection booking form." }),
      defineField({ name: "secondaryCta", title: "Second button label", type: "string", description: "Scrolls to the gallery." }),
      imageField("backgroundImage", "Background image", "hero", { description: "Shown full-screen behind the heading; keep the right side for the subject." }),
      mobileOverrideField("backgroundImageMobile"),
      legacy(defineField({ name: "eyebrow", title: "Eyebrow", type: "string" })),
      legacy(defineField({ name: "supportPoints", title: "Support points", type: "array", of: [{ type: "string" }] })),
      legacy(defineGuidedImageField({ name: "beforeVisual", title: "Before image", spec: cmsImageSpecs.hero })),
      legacy(defineGuidedImageField({ name: "afterVisual", title: "After image", spec: cmsImageSpecs.hero })),
      legacy(defineGuidedImageField({ name: "visual", title: "Legacy fallback image", spec: cmsImageSpecs.hero }))
    ], "hero"),

    section("evidenceSection", "Research", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "costLabel", title: "Cost card label", type: "string" }),
      defineField({ name: "costPrefix", title: "Cost card qualifier", type: "string", description: "Small text before the figure, e.g. “Up to”." }),
      defineField({ name: "costFigure", title: "Cost card figure", type: "string", description: "Shown struck through, e.g. “₹10 lakh”." }),
      defineField({ name: "cards", title: "Statistics", type: "array", of: [{ type: "evidenceCard" }], description: "Four work best." }),
      defineField({ name: "sourcesNote", title: "Sources line", type: "text", rows: 2 }),
      legacy(defineField({ name: "title", title: "Title", type: "string" })),
      legacy(defineField({ name: "subtitle", title: "Subtitle", type: "string" }))
    ], "research"),

    section("whatWeDoSection", "Book-a-visit strip", [
      ...headingFields(),
      defineField({ name: "description", title: "Supporting text", type: "text", rows: 3 }),
      imageField("sideImage", "Photo", "landscape"),
      legacy(defineField({ name: "eyebrow", title: "Eyebrow", type: "string" })),
      legacy(defineField({ name: "title", title: "Title", type: "string" })),
      legacy(defineField({ name: "valueTags", title: "Value tags", type: "array", of: [{ type: "string" }] })),
      legacy(defineGuidedImageField({ name: "visual", title: "Visual", spec: cmsImageSpecs.landscape }))
    ], "visit"),

    section("whySection", "Why Mason", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "intro", title: "Supporting text", type: "text", rows: 2 }),
      defineField({
        name: "items",
        title: "Reasons",
        type: "array",
        description: "Six fit the design best.",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({ name: "tag", title: "Small label", type: "string" }),
              defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
              defineField({ name: "description", title: "Text", type: "text", rows: 3, validation: (rule) => rule.required() })
            ],
            preview: { select: { title: "title", subtitle: "tag" } }
          })
        ]
      }),
      legacy(defineField({ name: "title", title: "Title", type: "string" })),
      legacy(defineField({ name: "subtitle", title: "Subtitle", type: "text" }))
    ], "why"),

    section("packagesSection", "Packages preview", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({
        name: "subtitle",
        title: "Supporting text",
        type: "text",
        rows: 3,
        description: "You can write {standard_price} or {advanced_price} to insert the current price."
      }),
      defineField({ name: "footnote", title: "Note below the cards", type: "text", rows: 2 }),
      legacy(defineField({ name: "title", title: "Title", type: "string" }))
    ], "packages"),

    section("processSection", "How it works", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "intro", title: "Supporting text", type: "text", rows: 2 }),
      defineField({
        name: "websiteSteps",
        title: "Steps",
        type: "array",
        description: "Three fit the design best.",
        of: [
          defineArrayMember({
            type: "object",
            fields: [
              defineField({ name: "title", title: "Step title", type: "string", validation: (rule) => rule.required() }),
              defineField({ name: "description", title: "Step text", type: "text", rows: 3, validation: (rule) => rule.required() })
            ],
            preview: { select: { title: "title", subtitle: "description" } }
          })
        ]
      }),
      defineField({ name: "primaryCta", title: "Button label", type: "string", description: "Opens the free-inspection booking form." }),
      legacy(defineField({ name: "title", title: "Title", type: "string" })),
      legacy(defineField({ name: "subtitle", title: "Subtitle", type: "text" })),
      legacy(defineField({ name: "highlights", title: "Highlights", type: "array", of: [{ type: "string" }] })),
      legacy(defineField({ name: "addOnDisclosure", title: "Footer line", type: "text" })),
      legacy(defineField({ name: "secondaryCta", title: "Secondary CTA", type: "string" })),
      legacy(defineField({ name: "steps", title: "Steps (old)", type: "array", of: [{ type: "processStep" }] }))
    ], "process"),

    section("doctorsSection", "Doctors", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "intro", title: "Supporting text", type: "text", rows: 2, description: "Doctors themselves are edited under Doctors & Experts; the disclaimer under Contact & Support." }),
      legacy(defineField({ name: "title", title: "Title", type: "string" })),
      legacy(defineField({ name: "subtitle", title: "Subtitle", type: "text" }))
    ], "doctors"),

    section("testimonialsSection", "Testimonials", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "intro", title: "Supporting text", type: "text", rows: 2, description: "The testimonials themselves are edited under Testimonials." }),
      legacy(defineField({ name: "title", title: "Title", type: "string" })),
      legacy(defineField({ name: "subtitle", title: "Subtitle", type: "text" }))
    ], "testimonials"),

    section("finalCtaSection", "Final call to action", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "subtitle", title: "Supporting text", type: "text", rows: 2 }),
      defineField({ name: "primaryCta", title: "Button label", type: "string", description: "Opens the free-inspection booking form." }),
      plainList("badges", "Reassurance points", "Short lines shown with a tick under the button."),
      imageField("backgroundImage", "Background image", "hero"),
      legacy(defineField({ name: "title", title: "Title", type: "string" })),
      legacy(defineField({ name: "secondaryLabel", title: "Secondary label", type: "string" }))
    ], "finalCta"),

    // Kept for existing data only: FAQs, gallery and the old evidence block now live elsewhere.
    legacy(defineField({ name: "transformationGallerySection", title: "Transformation gallery (old)", type: "object", fields: [
      defineField({ name: "title", title: "Title", type: "string" }),
      defineField({ name: "subtitle", title: "Subtitle", type: "text" })
    ] })),
    legacy(defineField({ name: "faqSection", title: "FAQ (old)", type: "object", fields: [
      defineField({ name: "title", title: "Title", type: "string" }),
      defineField({ name: "subtitle", title: "Subtitle", type: "text" }),
      defineField({ name: "items", title: "Items", type: "array", of: [{ type: "faqItem" }] })
    ] })),
    legacy(defineField({ name: "problemSection", title: "Problem section (old)", type: "object", fields: [
      defineField({ name: "title", title: "Title", type: "string" }),
      defineField({ name: "subtitle", title: "Subtitle", type: "string" }),
      defineField({ name: "lead", title: "Lead", type: "text" }),
      defineField({ name: "highlights", title: "Highlights", type: "array", of: [{ type: "string" }] })
    ] }))
  ],
  preview: { prepare: () => ({ title: "Homepage" }) }
});
