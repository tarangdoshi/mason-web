import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "./sanity/env";

const singletonTypes = new Set(["homepage", "siteSettings", "riskQuiz"]);

export default defineConfig({
  name: "mason-company",
  title: "Mason Company",
  projectId: sanityProjectId || "missing-project-id",
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  basePath: "/crm/content",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Mason content")
          .items([
            S.listItem().title("Homepage").id("homepage").child(S.document().schemaType("homepage").documentId("homepage")),
            S.listItem().title("Site settings").id("siteSettings").child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.listItem().title("Risk quiz").id("riskQuiz").child(S.document().schemaType("riskQuiz").documentId("riskQuiz")),
            S.divider(),
            ...S.documentTypeListItems().filter((item) => {
              const id = item.getId();
              return id ? !singletonTypes.has(id) : true;
            })
          ])
    }),
    presentationTool({
      previewUrl: {
        previewMode: {
          enable: "/api/draft-mode/enable"
        }
      },
      resolve: {
        locations: {
          homepage: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/" }] }) },
          package: { select: {}, resolve: () => ({ locations: [{ title: "Compare packages", href: "/compare-packages" }] }) },
          packageFeature: { select: {}, resolve: () => ({ locations: [{ title: "Compare packages", href: "/compare-packages" }] }) },
          testimonial: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/" }] }) },
          doctor: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/" }] }) },
          galleryItem: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/" }] }) },
          siteSettings: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/" }] }) },
          riskQuiz: {
            select: {},
            resolve: () => ({
              locations: [
                { title: "Homepage", href: "/" },
                { title: "Compare packages", href: "/compare-packages" }
              ]
            })
          }
        }
      }
    })
  ],
  schema: { types: schemaTypes }
});
