import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhyContent from "@/components/WhyContent";

export const metadata: Metadata = {
  alternates: {canonical: "https://www.masoncompany.in/why"},
  title: "Why Mason - Safety isn't a product, it's a plan",
  description:
    "Why families choose Mason: a complete, doctor-informed, expert-installed bathroom-safety solution - one accountable team, from assessment to handover.",
};

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
