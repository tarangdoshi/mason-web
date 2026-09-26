import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { PRIVACY } from "@/components/legal-data";

export const metadata: Metadata = {
  title: "Privacy Policy - Mason Company",
  description:
    "How Mason Company collects, uses, and protects the personal information you share when you contact us or book a bathroom safety visit.",
};

export default function PrivacyPage() {
  return <LegalPage doc={PRIVACY} />;
}
