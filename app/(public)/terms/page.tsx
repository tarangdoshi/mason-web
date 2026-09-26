import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { TERMS } from "@/components/legal-data";

export const metadata: Metadata = {
  title: "Terms & Conditions - Mason Company",
  description:
    "The terms that govern Mason Company's bathroom safety visits, assessments, and installation services.",
};

export default function TermsPage() {
  return <LegalPage doc={TERMS} />;
}
