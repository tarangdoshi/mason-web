import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { PRIVACY } from "@/components/legal-data";
import { getPublicSiteContent } from "@/lib/cms/load";
import { withContactDetails } from "@/lib/cms/legal";
import { cmsMetadata } from "@/lib/cms/seo";

/* Provisions are code-owned; contact details come from Contact & Support. */
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("privacy", {
    title: "Privacy Policy - Mason Company",
    description:
      "How Mason Company collects, uses, and protects the personal information you share when you contact us or book a bathroom safety visit.",
  });
}

export default async function PrivacyPage() {
  const { settings } = await getPublicSiteContent();
  return <LegalPage doc={withContactDetails(PRIVACY, settings.contact)} />;
}
