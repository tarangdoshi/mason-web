import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool, type StructureBuilder } from "sanity/structure";
import { schemaTypes } from "./sanity/schemaTypes";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "./sanity/env";

/* Documents that exist exactly once. They open straight from the menu and
   cannot be duplicated, deleted or created again. */
const singletons: { id: string; type: string; title: string }[] = [
  { id: "homepage", type: "homepage", title: "Homepage" },
  { id: "aboutPage", type: "aboutPage", title: "About" },
  { id: "packagesPage", type: "packagesPage", title: "Packages page" },
  { id: "faqs", type: "faqs", title: "FAQs" },
  { id: "gallery", type: "gallery", title: "Gallery" },
  { id: "siteSettings", type: "siteSettings", title: "Contact & Support" },
  { id: "seo", type: "seo", title: "SEO" },
  { id: "riskQuiz", type: "riskQuiz", title: "Risk quiz (not on the website)" }
];
const singletonTypes = new Set(singletons.map((item) => item.type));

const single = (S: StructureBuilder, id: string) => {
  const item = singletons.find((entry) => entry.id === id)!;
  return S.listItem().title(item.title).id(item.id).child(S.document().schemaType(item.type).documentId(item.id).title(item.title));
};

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
          .title("Website")
          .items([
            single(S, "homepage"),
            single(S, "aboutPage"),
            S.listItem()
              .title("Packages")
              .id("packages")
              .child(
                S.list()
                  .title("Packages")
                  .items([
                    S.listItem().title("Standard").id("package-standard").child(S.document().schemaType("package").documentId("package-package-standard").title("Standard")),
                    S.listItem().title("Advanced").id("package-advanced").child(S.document().schemaType("package").documentId("package-package-advanced").title("Advanced")),
                    single(S, "packagesPage"),
                    S.documentTypeListItem("packageFeature").title("Package Components")
                  ])
              ),
            single(S, "faqs"),
            S.documentTypeListItem("testimonial").title("Testimonials"),
            S.documentTypeListItem("doctor").title("Doctors & Experts"),
            single(S, "gallery"),
            single(S, "siteSettings"),
            single(S, "seo"),
            S.divider(),
            S.listItem()
              .title("More")
              .id("more")
              .child(
                S.list()
                  .title("Not shown on the website")
                  .items([single(S, "riskQuiz"), S.documentTypeListItem("galleryItem").title("Old gallery items")])
              )
          ])
    }),
    presentationTool({
      previewUrl: { previewMode: { enable: "/api/draft-mode/enable", disable: "/api/draft-mode/disable" } },
      resolve: {
        locations: {
          homepage: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/" }] }) },
          aboutPage: { select: {}, resolve: () => ({ locations: [{ title: "About", href: "/about" }] }) },
          faqs: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/#faq" }] }) },
          gallery: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/#transformations" }] }) },
          testimonial: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/#testimonials" }] }) },
          doctor: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/#doctors" }] }) },
          siteSettings: {
            select: {},
            resolve: () => ({ locations: [{ title: "Contact", href: "/contact" }, { title: "Homepage", href: "/" }] })
          },
          seo: { select: {}, resolve: () => ({ locations: [{ title: "Homepage", href: "/" }] }) },
          packagesPage: { select: {}, resolve: () => ({ locations: [{ title: "Packages", href: "/packages" }, { title: "Homepage", href: "/#packages" }] }) },
          package: {
            select: { code: "code" },
            resolve: (doc) => {
              const slug = doc?.code === "package-advanced" ? "advanced" : "standard";
              return {
                locations: [
                  { title: `${slug === "advanced" ? "Advanced" : "Standard"} package page`, href: `/packages/${slug}` },
                  { title: "Packages", href: "/packages" },
                  { title: "Homepage", href: "/#packages" }
                ]
              };
            }
          },
          packageFeature: { select: {}, resolve: () => ({ locations: [{ title: "Packages", href: "/packages#kit" }] }) }
        }
      }
    })
  ],
  schema: {
    types: schemaTypes,
    // Singletons are opened from the menu, never created from "New document".
    templates: (templates) => templates.filter(({ schemaType }) => !singletonTypes.has(schemaType) && schemaType !== "package")
  },
  document: {
    actions: (actions, { schemaType }) =>
      singletonTypes.has(schemaType) || schemaType === "package"
        ? actions.filter(({ action }) => action !== "duplicate" && action !== "delete" && action !== "unpublish")
        : actions
  }
});
