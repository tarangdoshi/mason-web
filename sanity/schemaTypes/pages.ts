import { defineArrayMember, defineField, defineType } from "sanity";
import { headingFields, imageField, plainList } from "./fields";

/* Single-copy documents for website pages and sections. Each exists once;
   Studio opens it directly from the menu. */

export const faqs = defineType({
  name: "faqs",
  title: "FAQs",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
    ...headingFields(),
    defineField({ name: "intro", title: "Supporting text", type: "text", rows: 2 }),
    defineField({
      name: "items",
      title: "Questions",
      type: "array",
      description:
        "Drag to reorder. Switch on “Hide” to take a question off the website without deleting it. In answers you can write {standard_price} or {advanced_price} to insert the current price.",
      of: [
        defineArrayMember({
          type: "object",
          name: "faqEntry",
          fields: [
            defineField({ name: "question", title: "Question", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "answer", title: "Answer", type: "text", rows: 4, validation: (rule) => rule.required() }),
            defineField({ name: "hidden", title: "Hide from website", type: "boolean", initialValue: false })
          ],
          preview: {
            select: { title: "question", hidden: "hidden" },
            prepare: ({ title, hidden }) => ({ title, subtitle: hidden ? "Hidden from website" : undefined })
          }
        })
      ]
    })
  ],
  preview: { prepare: () => ({ title: "FAQs" }) }
});

export const gallery = defineType({
  name: "gallery",
  title: "Gallery",
  type: "document",
  fields: [
    defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
    ...headingFields(),
    defineField({ name: "subtitle", title: "Supporting text", type: "text", rows: 2 }),
    imageField("sliderBefore", "Before/after slider — before image", "landscape", { description: "Pair with the after image; use the same size and framing." }),
    imageField("sliderAfter", "Before/after slider — after image", "landscape"),
    defineField({
      name: "tiles",
      title: "Gallery photos",
      type: "array",
      description: "Drag to reorder. Four fit the layout best. Switch on “Hide” to take a photo off the website.",
      of: [
        defineArrayMember({
          type: "object",
          name: "galleryTile",
          fields: [
            imageField("image", "Photo", "portrait"),
            defineField({ name: "label", title: "Caption", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "hidden", title: "Hide from website", type: "boolean", initialValue: false })
          ],
          preview: {
            select: { title: "label", media: "image", hidden: "hidden" },
            prepare: ({ title, media, hidden }) => ({ title, media, subtitle: hidden ? "Hidden from website" : undefined })
          }
        })
      ]
    })
  ],
  preview: { prepare: () => ({ title: "Gallery" }) }
});

export const packagesPage = defineType({
  name: "packagesPage",
  title: "Packages page",
  type: "document",
  groups: [
    { name: "page", title: "Packages page", default: true },
    { name: "cards", title: "Package cards" }
  ],
  fields: [
    defineField({ name: "eyebrow", title: "Small label above the heading", type: "string", group: "page" }),
    ...headingFields({ group: "page" }),
    defineField({ name: "subcopy", title: "Supporting text", type: "text", rows: 2, group: "page" }),
    defineField({ name: "scrollCue", title: "Link to the packages", type: "string", group: "page" }),
    { ...imageField("image", "Photo", "landscape"), group: "page" },
    defineField({ name: "chooseLabel", title: "Label above the cards", type: "string", group: "page" }),
    defineField({ name: "chooseNote", title: "Note above the cards", type: "string", group: "page" }),
    defineField({ name: "kitCue", title: "Link to the component list", type: "string", group: "page" }),
    defineField({ name: "kitHeading", title: "Component list heading", type: "string", group: "page", description: "The number of components is added automatically." }),
    defineField({ name: "kitNote", title: "Component list note", type: "string", group: "page" }),
    defineField({ name: "kitFootnote", title: "Line below the component list", type: "text", rows: 2, group: "page", description: "Write {count} to insert the number of components." }),
    defineField({
      name: "cardRows",
      title: "Card checklist",
      type: "array",
      group: "cards",
      description: "Lines shown on both package cards. Tick which package includes each line. Write {count} to insert the number of components.",
      of: [
        defineArrayMember({
          type: "object",
          name: "cardRow",
          fields: [
            defineField({ name: "label", title: "Line", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "standard", title: "Included in Standard", type: "boolean", initialValue: true }),
            defineField({ name: "advanced", title: "Included in Advanced", type: "boolean", initialValue: true })
          ],
          preview: {
            select: { title: "label", standard: "standard", advanced: "advanced" },
            prepare: ({ title, standard, advanced }) => ({ title, subtitle: [standard ? "Standard" : null, advanced ? "Advanced" : null].filter(Boolean).join(" + ") || "Neither" })
          }
        })
      ]
    }),
    defineField({ name: "popularLabel", title: "“Most popular” badge text", type: "string", group: "cards" }),
    defineField({ name: "homeCardCta", title: "Card button on the homepage", type: "string", group: "cards", description: "Opens that package’s page." }),
    defineField({ name: "pageCardCta", title: "Card button on the Packages page", type: "string", group: "cards", description: "Opens the free-inspection booking form." })
  ],
  preview: { prepare: () => ({ title: "Packages page" }) }
});

const aboutSection = (name: string, title: string, fields: ReturnType<typeof defineField>[]) =>
  defineField({ name, title, type: "object", group: name, options: { collapsible: false }, fields });

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About",
  type: "document",
  groups: [
    { name: "hero", title: "Top", default: true },
    { name: "story", title: "Our story" },
    { name: "why", title: "Why we exist" },
    { name: "team", title: "Founders" },
    { name: "approach", title: "Our approach" },
    { name: "goals", title: "Goals" },
    { name: "closing", title: "Closing" }
  ],
  fields: [
    aboutSection("hero", "Top of page", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      plainList("paragraphs", "Paragraphs"),
      defineField({ name: "ctaLabel", title: "Button label", type: "string" }),
      imageField("image", "Wide photo", "hero", { description: "Until a photo is added the page shows a placeholder." })
    ]),
    aboutSection("story", "Our story", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({
        name: "beats",
        title: "Story",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            name: "storyBeat",
            fields: [
              defineField({ name: "label", title: "Small label", type: "string", validation: (rule) => rule.required() }),
              defineField({ name: "body", title: "Text", type: "text", rows: 5, validation: (rule) => rule.required() })
            ],
            preview: { select: { title: "label", subtitle: "body" } }
          })
        ]
      }),
      imageField("image", "Photo (shown after the second part)", "landscape")
    ]),
    defineField({
      name: "statement",
      title: "Statement line",
      type: "object",
      group: "story",
      options: { collapsible: false },
      fields: headingFields({ title: "Statement" })
    }),
    aboutSection("why", "Why we exist", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      plainList("refusals", "“It should not…” lines"),
      defineField({ name: "promise", title: "Promise", type: "text", rows: 3 }),
      defineField({ name: "hope", title: "Closing line", type: "text", rows: 3 })
    ]),
    aboutSection("team", "Founders", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "intro", title: "Supporting text", type: "text", rows: 3 }),
      plainList("trust", "Trust points"),
      defineField({
        name: "founders",
        title: "Founders",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            name: "founder",
            fields: [
              defineField({ name: "name", title: "Name", type: "string", validation: (rule) => rule.required() }),
              defineField({ name: "role", title: "Role", type: "string" }),
              defineField({ name: "bio", title: "Bio", type: "text", rows: 4, validation: (rule) => rule.required() }),
              plainList("credentials", "Credentials"),
              imageField("photo", "Portrait", "portrait", { description: "Until a photo is added the page shows initials." })
            ],
            preview: { select: { title: "name", subtitle: "role", media: "photo" } }
          })
        ]
      })
    ]),
    aboutSection("approach", "Our approach", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      plainList("paragraphs", "Paragraphs"),
      imageField("image", "Photo", "landscape"),
      defineField({ name: "routineLabel", title: "Routine list heading", type: "string" }),
      plainList("routine", "Routine list")
    ]),
    aboutSection("goals", "Goals", [
      defineField({ name: "eyebrow", title: "Small label above the heading", type: "string" }),
      ...headingFields(),
      defineField({ name: "intro", title: "Supporting text", type: "string" }),
      defineField({
        name: "items",
        title: "Goals",
        type: "array",
        of: [
          defineArrayMember({
            type: "object",
            name: "goal",
            fields: [
              defineField({ name: "label", title: "Small label", type: "string", validation: (rule) => rule.required() }),
              defineField({ name: "body", title: "Text", type: "text", rows: 2, validation: (rule) => rule.required() })
            ],
            preview: { select: { title: "label", subtitle: "body" } }
          })
        ]
      })
    ]),
    aboutSection("closing", "Closing", [
      imageField("image", "Wide photo", "hero"),
      ...headingFields(),
      defineField({ name: "body", title: "Supporting text", type: "text", rows: 2 }),
      defineField({ name: "ctaLabel", title: "Button label", type: "string" })
    ])
  ],
  preview: { prepare: () => ({ title: "About" }) }
});

const seoPage = (name: string, title: string) =>
  defineField({
    name,
    title,
    type: "object",
    options: { collapsible: true, collapsed: true },
    fields: [
      defineField({ name: "title", title: "SEO title", type: "string", description: "Shown in Google results and the browser tab. Aim for under 60 characters.", validation: (rule) => rule.max(70).warning("Long titles are cut off in search results.") }),
      defineField({ name: "description", title: "Meta description", type: "text", rows: 2, description: "Shown under the title in Google. Aim for 120–160 characters.", validation: (rule) => rule.max(200).warning("Long descriptions are cut off in search results.") }),
      defineField({ name: "socialTitle", title: "Social title", type: "string", description: "For WhatsApp, Facebook and LinkedIn previews. Leave empty to reuse the SEO title." }),
      defineField({ name: "socialDescription", title: "Social description", type: "text", rows: 2, description: "Leave empty to reuse the meta description." }),
      imageField("socialImage", "Social image", "social")
    ]
  });

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "document",
  description: "Leave any field empty to keep the website’s default. Page addresses are fixed and cannot be changed here.",
  fields: [
    seoPage("home", "Homepage"),
    seoPage("about", "About"),
    seoPage("packages", "Packages"),
    seoPage("packageStandard", "Standard package page"),
    seoPage("packageAdvanced", "Advanced package page"),
    seoPage("contact", "Contact"),
    seoPage("why", "Why Mason"),
    seoPage("privacy", "Privacy Policy"),
    seoPage("terms", "Terms & Conditions")
  ],
  preview: { prepare: () => ({ title: "SEO" }) }
});
