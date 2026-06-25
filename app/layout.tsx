import type { Metadata } from "next";
import Script from "next/script";
import { Manrope, Newsreader } from "next/font/google";
import "./styles.css";

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
  title: "Mason Company | Bathroom Safety Upgrades for Ageing Parents",
  description: "Mason Company delivers premium bathroom safety upgrades with a warm, practical approach for modern families in Mumbai and Goa."
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
