import type { MetadataRoute } from "next";

const SITE_URL = "https://www.masoncompany.in";

const ROUTES = [
  "/",
  "/about",
  "/compare-packages",
  "/packages/standard",
  "/packages/advanced",
  "/evidence",
  "/communications",
  "/privacy",
  "/terms"
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path.startsWith("/packages/") ? 0.8 : 0.6
  }));
}
