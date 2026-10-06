import type { Metadata } from "next";
import KnowledgePage from "@/components/KnowledgePage";
import { GUIDE_PUBLISHED, guideDoc, guideSources } from "@/content/knowledge/guide";
import { guideJsonLd, jsonLdScript } from "@/lib/seo/structured-data";

const PATH = "/guides/bathroom-safety-for-elderly-parents";
const DESCRIPTION =
  "What to check in an elderly parent's bathroom in India: the five risky moments, a ten-minute home check, grab bars, wet floors and bathing, and when to get a professional assessment - with sources.";

export const metadata: Metadata = {
  alternates: { canonical: PATH },
  title: "Bathroom Safety for Elderly Parents in India: What to Check | Mason Company",
  description: DESCRIPTION,
  openGraph: { type: "article", title: "Bathroom safety for elderly parents in India", description: DESCRIPTION, url: PATH }
};

export default function BathroomSafetyGuidePage() {
  const jsonLd = guideJsonLd({
    path: PATH,
    headline: guideDoc.title,
    description: DESCRIPTION,
    published: GUIDE_PUBLISHED,
    citations: guideSources.map((source) => source.href)
  });
  return <KnowledgePage doc={guideDoc} jsonLd={jsonLdScript(jsonLd)} />;
}
