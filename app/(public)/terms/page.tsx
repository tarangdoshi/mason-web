import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { TERMS } from "@/components/legal-data";
import { getPublicSiteContent } from "@/lib/cms/load";
import { withContactDetails } from "@/lib/cms/legal";
import { cmsMetadata } from "@/lib/cms/seo";

/* Provisions are code-owned; contact details come from Contact & Support. */
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("terms", {
    title: "Terms & Conditions - Mason Company",
    description:
      "The terms that govern Mason Company's bathroom safety visits, assessments, and installation services.",
  });
}

export default async function TermsPage() {
  const { settings } = await getPublicSiteContent();
  return <LegalPage doc={withContactDetails(TERMS, settings.contact)} />;
}
