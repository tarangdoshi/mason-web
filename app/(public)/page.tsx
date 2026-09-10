export const metadata = {alternates: {canonical: "https://www.masoncompany.in/"}};
import { redirect } from "next/navigation";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Safer from "@/components/Safer";
import WhyMason from "@/components/WhyMason";
import Transformations from "@/components/Transformations";
import Packages from "@/components/Packages";
import Process from "@/components/Process";
import Doctors from "@/components/Doctors";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import Booking from "@/components/Booking";
import Footer from "@/components/Footer";

export default async function Home({searchParams}: {searchParams?: Promise<Record<string, string | string[] | undefined>>}) {
  const query = await searchParams;
  if (query?.preview === "draft") redirect("/content-preview?preview=draft");
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Safer />
        <span id="why-mason" />
        <WhyMason />
        <span id="before-after" />
        <Transformations />
        <span id="package-comparison" />
        <Packages />
        <span id="how-it-works" />
        <Process />
        <Doctors />
        <Testimonials />
        <FAQ />
        <Booking />
      </main>
      <Footer />
    </>
  );
}
