import LaunchAnalytics from "../components/launch-analytics";
import type { Metadata } from "next";
import { Archivo, Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./public.css";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollRestoration from "@/components/ScrollRestoration";
import BookingProvider from "@/components/BookingDialog";
import SiteSettingsProvider from "@/components/SiteSettingsProvider";
import DraftModeBanner from "@/components/DraftModeBanner";
import { VisualEditing } from "next-sanity/visual-editing";
import { getPublicSiteContent, isPreviewingDrafts } from "@/lib/cms/load";

/* Display — big impactful headlines. The dominant typeface. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

/* Serif — expressive accent words, always italic, dropped inside headlines. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  style: ["italic"],
});

/* Sans — body copy, UI, buttons. The document default. */
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

/* Mono — small labels, eyebrow text, numerals. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  openGraph: {type:"website", siteName:"Mason Company", title:"Mason Company — Safer bathrooms for ageing parents", description:"Doctor-informed bathroom safety upgrades. Mason is currently available in Goa.", images:["/prerna/images/hero-install.jpg"]},
  twitter: {card:"summary_large_image", images:["/prerna/images/hero-install.jpg"]},
  metadataBase: new URL("https://www.masoncompany.in"),
  title: "Mason Company - Safer bathrooms for ageing parents",
  description:
    "Premium, doctor-informed, expert-installed bathroom safety upgrades that keep the home feeling like home. Book Free Inspection.",
};

export default async function PublicLayout({children}: {children: React.ReactNode}) {
 const { settings } = await getPublicSiteContent();
 const previewingDrafts = await isPreviewingDrafts();
 return <div className={`${archivo.variable} ${fraunces.variable} ${geist.variable} ${geistMono.variable} mason-public grain min-h-full bg-ink text-cream`}>
 <LaunchAnalytics /><SiteSettingsProvider value={settings}><SmoothScroll><ScrollRestoration /><BookingProvider>{children}</BookingProvider></SmoothScroll></SiteSettingsProvider>
 {previewingDrafts ? <><DraftModeBanner /><VisualEditing /></> : null}
 </div>;
}
