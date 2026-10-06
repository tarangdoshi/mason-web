import type { Metadata } from "next";
import KnowledgePage from "@/components/KnowledgePage";
import { getPublicSiteContent } from "@/lib/cms/load";
import { assessmentDoc } from "@/content/knowledge/assessment";
import { assessmentJsonLd, jsonLdScript } from "@/lib/seo/structured-data";

/* Mason's service page for the free bathroom safety inspection in Goa. Prices, kit size and the process
   steps come from Sanity, so published changes appear within a minute. */
export const revalidate = 60;

const DESCRIPTION =
  "A free bathroom safety inspection for ageing parents in Goa. Mason observes how your parent uses the bathroom, explains the risks and recommends what would help - you decide.";

export const metadata: Metadata = {
  alternates: { canonical: "/bathroom-safety-assessment" },
  title: "Bathroom Safety Assessment in Goa | Free Inspection | Mason Company",
  description: DESCRIPTION,
  openGraph: { title: "Bathroom safety assessment in Goa | Mason Company", description: DESCRIPTION, url: "/bathroom-safety-assessment" }
};

export default async function BathroomSafetyAssessmentPage() {
  const { home, packages } = await getPublicSiteContent();
  const price = (code: string) => packages.plans.find((plan) => plan.code === code)?.price ?? "";
  const doc = assessmentDoc({
    standardPrice: price("package-standard"),
    advancedPrice: price("package-advanced"),
    componentCount: packages.components.length,
    processSteps: home.process.steps
  });
  return <KnowledgePage doc={doc} jsonLd={jsonLdScript(assessmentJsonLd(DESCRIPTION))} />;
}
