import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhyContent from "@/components/WhyContent";
import { cmsMetadata } from "@/lib/cms/seo";

export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("why", {
    alternates: {canonical: "https://www.masoncompany.in/why"},
    title: "Why Mason - Safety isn't a product, it's a plan",
    description:
      "Why families choose Mason: a complete, doctor-informed, expert-installed bathroom-safety solution - one accountable team, from assessment to handover.",
  });
}

export default function WhyPage() {
  return (
    <>
      <Nav />
      <main>
        <WhyContent />
      </main>
      <Footer />
    </>
  );
}
