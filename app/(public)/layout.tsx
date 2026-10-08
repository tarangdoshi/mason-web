import LaunchAnalytics from "../components/launch-analytics";
import type { Metadata } from "next";
import { Archivo, Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./public.css";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollRestoration from "@/components/ScrollRestoration";
import BookingProvider from "@/components/BookingDialog";
import SiteSettingsProvider from "@/components/SiteSettingsProvider";
import EditModeProvider from "@/components/EditModeProvider";
import DraftModeBanner from "@/components/DraftModeBanner";
import { VisualEditing } from "next-sanity/visual-editing";
import { getPublicSiteContent, isPreviewingDrafts } from "@/lib/cms/load";
import { pageOpenGraph, pageTwitter } from "@/lib/seo/open-graph";

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

/* Mono — small labels, eyebrow text, numerals. Never in the first screen, so
   it is not preloaded: the hero's display/serif fonts get the early bandwidth. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const SITE_SHARE_TITLE = "Mason Company — Safer bathrooms for ageing parents";
const SITE_SHARE_DESCRIPTION = "Doctor-informed bathroom safety upgrades. Mason is currently available in Goa.";

/* The fallback share card, for any route that does not set its own. Pages that do set openGraph
   replace this object wholesale, so each of them builds it from the same helper. No og:url here:
   the layout cannot know the page's path, so shares of /why, /about etc. keep their own URL. */
export const metadata: Metadata = {
  openGraph: pageOpenGraph({ title: SITE_SHARE_TITLE, description: SITE_SHARE_DESCRIPTION }),
  twitter: pageTwitter({ title: SITE_SHARE_TITLE, description: SITE_SHARE_DESCRIPTION }),
  metadataBase: new URL("https://www.masoncompany.in"),
  title: "Mason Company - Safer bathrooms for ageing parents",
  description:
    "Premium, doctor-informed, expert-installed bathroom safety upgrades that keep the home feeling like home. Book Free Inspection.",
};

export default async function PublicLayout({children}: {children: React.ReactNode}) {
 const { settings } = await getPublicSiteContent();
 const previewingDrafts = await isPreviewingDrafts();
 return <div className={`${archivo.variable} ${fraunces.variable} ${geist.variable} ${geistMono.variable} mason-public grain min-h-full bg-ink text-cream`}>
 <LaunchAnalytics /><EditModeProvider enabled={previewingDrafts}><SiteSettingsProvider value={settings}><SmoothScroll><ScrollRestoration /><BookingProvider>{children}</BookingProvider></SmoothScroll></SiteSettingsProvider></EditModeProvider>
 {previewingDrafts ? <><DraftModeBanner /><VisualEditing /></> : null}
 </div>;
}
