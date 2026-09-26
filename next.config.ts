import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.AEGIS_DIST_DIR || ".next",
  // Images uploaded in Sanity Studio are served from Sanity's CDN.
  images: { remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" }] },
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.join(process.cwd(), "../..") })
};

export default nextConfig;
