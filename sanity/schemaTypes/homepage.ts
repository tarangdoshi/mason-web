import { defineField, defineType } from "sanity";
import { cmsImageSpecs, defineGuidedImageField } from "./image-guidance";

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      fields: [
        { name: "eyebrow", title: "Eyebrow", type: "string" },
        { name: "heading", title: "Heading", type: "string" },
        { name: "subcopy", title: "Subcopy", type: "text", rows: 4 },
        { name: "primaryCta", title: "Primary CTA", type: "string" },
        { name: "secondaryCta", title: "Secondary CTA", type: "string" },
        { name: "supportPoints", title: "Support points", type: "array", of: [{ type: "string" }] },
        defineGuidedImageField({
          name: "beforeVisual",
          title: "Before image",
          spec: { ...cmsImageSpecs.hero, matchingField: "afterVisual" },
          description: "Owned by the Hero before/after slider."
        }),
        defineGuidedImageField({
          name: "afterVisual",
          title: "After image",
          spec: { ...cmsImageSpecs.hero, matchingField: "beforeVisual" },
          description: "Owned by the Hero before/after slider."
        }),
        defineGuidedImageField({
          name: "visual",
          title: "Legacy fallback image",
          spec: cmsImageSpecs.hero,
          description: "Retained for existing content. Used only when a dedicated Hero image is unavailable."
        })
      ]
    }),
    defineField({
      name: "whatWeDoSection",
      title: "What we do section",
      type: "object",
      fields: [
        { name: "eyebrow", title: "Eyebrow", type: "string" },
        { name: "title", title: "Title", type: "string" },
        { name: "description", title: "Description", type: "text", rows: 4 },
        { name: "valueTags", title: "Value tags", type: "array", of: [{ type: "string" }] },
        defineGuidedImageField({
          name: "visual",
          title: "Visual",
          spec: cmsImageSpecs.landscape,
          description: "Displayed in the What We Do landscape media panel."
        })
      ]
    }),
    defineField({
      name: "transformationGallerySection",
      title: "Transformation gallery section",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 }
      ]
    }),
    defineField({
      name: "problemSection",
      title: "Evidence / why families act early",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "string" },
        { name: "lead", title: "Lead", type: "text", rows: 4 },
        { name: "highlights", title: "Highlights", type: "array", of: [{ type: "string" }] }
      ]
    }),
    defineField({
      name: "evidenceSection",
      title: "Evidence cards",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "string" },
        { name: "cards", title: "Cards", type: "array", of: [{ type: "evidenceCard" }] }
      ]
    }),
    defineField({
      name: "packagesSection",
      title: "Packages intro",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 }
      ]
    }),
    defineField({
      name: "whySection",
      title: "Why Mason Company",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 },
        {
          name: "items",
          title: "Items",
          type: "array",
          of: [
            {
              type: "object",
              fields: [
                { name: "title", title: "Title", type: "string" },
                { name: "description", title: "Description", type: "text", rows: 3 }
              ]
            }
          ]
        }
      ]
    }),
    defineField({
      name: "processSection",
      title: "Process",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 },
        { name: "highlights", title: "Highlights", type: "array", of: [{ type: "string" }] },
        { name: "addOnDisclosure", title: "Footer line", type: "text", rows: 3 },
        { name: "primaryCta", title: "Primary CTA", type: "string" },
        { name: "secondaryCta", title: "Secondary CTA", type: "string" },
        { name: "steps", title: "Steps", type: "array", of: [{ type: "processStep" }] }
      ]
    }),
    defineField({
      name: "doctorsSection",
      title: "Doctors section",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 }
      ]
    }),
    defineField({
      name: "testimonialsSection",
      title: "Testimonials section",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 }
      ]
    }),
    defineField({
      name: "faqSection",
      title: "FAQ",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 },
        { name: "items", title: "Items", type: "array", of: [{ type: "faqItem" }] }
      ]
    }),
    defineField({
      name: "finalCtaSection",
      title: "Final CTA",
      type: "object",
      fields: [
        { name: "title", title: "Title", type: "string" },
        { name: "subtitle", title: "Subtitle", type: "text", rows: 3 },
        { name: "primaryCta", title: "Primary CTA", type: "string" },
        { name: "secondaryLabel", title: "Secondary label", type: "string" }
      ]
    })
  ],
  preview: {
    prepare: () => ({ title: "Homepage" })
  }
});
