import { defineField, defineType } from "sanity";

export const riskQuiz = defineType({
  name: "riskQuiz",
  title: "Risk quiz",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "subtitle", title: "Subtitle", type: "text", rows: 3 }),
    defineField({ name: "intro", title: "Intro", type: "text", rows: 3 }),
    defineField({
      name: "questions",
      title: "Questions",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "id", title: "ID", type: "string" },
            { name: "prompt", title: "Prompt", type: "text", rows: 3 },
            {
              name: "options",
              title: "Options",
              type: "array",
              of: [
                {
                  type: "object",
                  fields: [
                    { name: "id", title: "ID", type: "string" },
                    { name: "label", title: "Label", type: "string" }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }),
    defineField({ name: "startLabel", title: "Start label", type: "string" }),
    defineField({ name: "resultCtaLabel", title: "Result CTA label", type: "string" }),
    defineField({ name: "restartLabel", title: "Restart label", type: "string" })
  ],
  preview: {
    select: { title: "title", subtitle: "subtitle" }
  }
});
