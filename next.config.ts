import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.AEGIS_DIST_DIR || ".next",
  // Images uploaded in Sanity Studio are served from Sanity's CDN.
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" }] },
  // Customer proposal links (/p/<share token>): never indexed, cached or leaked through the Referer header.
  async headers() {
    return [
      {
        source: "/p/:token*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" }
        ]
      }
    ];
  },
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.join(process.cwd(), "../..") })
};

export default nextConfig;
