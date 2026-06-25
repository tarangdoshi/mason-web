import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: process.env.AEGIS_DIST_DIR || ".next",
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: path.join(process.cwd(), "../..") })
};

export default nextConfig;
