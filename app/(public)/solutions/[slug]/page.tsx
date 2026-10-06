import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KnowledgePage from "@/components/KnowledgePage";
import { SERVICE_NAMES } from "@/lib/analytics";
import { getPublicSiteContent } from "@/lib/cms/load";
import { SOLUTIONS, SOLUTION_META, solutionDoc, solutionPath, type SolutionSlug } from "@/content/knowledge/solutions";
import { jsonLdScript, solutionJsonLd } from "@/lib/seo/structured-data";
import { pageOpenGraph } from "@/lib/seo/open-graph";

/* The four bathroom safety solution pages (grab bars, anti-slip floors, safer bathing, toilet safety).
   Prices, kit components and their photos come from Sanity, so published changes appear within a minute. */
export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((solution) => ({ slug: solution.slug }));
}

function isSolution(slug: string): slug is SolutionSlug {
  return SOLUTIONS.some((solution) => solution.slug === slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!isSolution(slug)) return {};
  const meta = SOLUTION_META[slug];
  const path = solutionPath(slug);
  return {
    alternates: { canonical: path },
    title: meta.title,
    description: meta.description,
    openGraph: pageOpenGraph({ title: meta.title, description: meta.description, url: path })
  };
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSolution(slug)) notFound();
  const { packages } = await getPublicSiteContent();
  const price = (code: string) => packages.plans.find((plan) => plan.code === code)?.price ?? "";
  const doc = solutionDoc(slug, {
    standardPrice: price("package-standard"),
    advancedPrice: price("package-advanced"),
    componentCount: packages.components.length,
    components: packages.components
  });
  const meta = SOLUTION_META[slug];
  const name = SOLUTIONS.find((solution) => solution.slug === slug)!.name;
  return (
    <KnowledgePage
      doc={doc}
      viewService={SERVICE_NAMES.safetyInstallation}
      jsonLd={jsonLdScript(solutionJsonLd({ path: solutionPath(slug), name, serviceType: meta.serviceType, description: meta.description }))}
    />
  );
}
