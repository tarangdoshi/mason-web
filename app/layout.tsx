import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Newsreader } from "next/font/google";
import "./legacy.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const newsreaderDisplay = Newsreader({
  subsets: ["latin"],
  variable: "--font-display"
});

const newsreaderBrand = Newsreader({
  subsets: ["latin"],
  variable: "--font-brand"
});

export const metadata: Metadata = {
  robots: process.env.VERCEL_ENV === "preview" ? {index:false,follow:false} : undefined,
  title: "Mason Company | Bathroom Safety Upgrades for Ageing Parents",
  description: "Mason Company delivers premium bathroom safety upgrades with a warm, practical approach for modern families in Goa.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=20261001", type: "image/x-icon", sizes: "any" },
      { url: "/mason-favicon.svg?v=20261001", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const enableFigmaCapture = process.env.NODE_ENV !== "production";

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${newsreaderDisplay.variable} ${newsreaderBrand.variable}`}>
        {enableFigmaCapture ? <Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="afterInteractive" /> : null}
        {children}
      </body>
    </html>
  );
}
