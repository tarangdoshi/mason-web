import type { Metadata } from "next";
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
import { getPublicSiteContent } from "@/lib/cms/load";
import { cmsMetadata } from "@/lib/cms/seo";

/* Content comes from Sanity. Published changes appear within a minute
   (regenerated in the background); draft previews render on every request. */
export const revalidate = 60;

export function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("home", { alternates: { canonical: "https://www.masoncompany.in/" } });
}

export default async function Home() {
  const { home, packages, settings } = await getPublicSiteContent();
  return (
    <>
      <Nav />
      <main>
        <Hero content={home.hero} />
        <Stats content={home.stats} />
        <Safer content={home.safer} />
        <span id="why-mason" />
        <WhyMason content={home.why} />
        <span id="before-after" />
        <Transformations content={home.transformations} />
        <span id="package-comparison" />
        <Packages content={home.packages} packages={packages} />
        <span id="how-it-works" />
        <Process content={home.process} />
        <Doctors content={home.doctors} disclaimer={settings.doctorDisclaimer} />
        <Testimonials content={home.testimonials} />
        <FAQ content={home.faq} />
        <Booking content={home.finalCta} />
      </main>
      <Footer />
    </>
  );
}
