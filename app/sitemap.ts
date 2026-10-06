import type { MetadataRoute } from "next";
import { SOLUTIONS, solutionPath } from "@/content/knowledge/solutions";

const SITE_URL = "https://www.masoncompany.in";

const ROUTES = [
  "/",
  "/about",
  "/packages",
  "/why",
  "/contact",
  "/compare-packages",
  "/packages/standard",
  "/packages/advanced",
  "/evidence",
  "/bathroom-safety-assessment",
  "/guides/bathroom-safety-for-elderly-parents",
  ...SOLUTIONS.map((solution) => solutionPath(solution.slug)),
  "/privacy",
  "/terms"
];

// lastModified is omitted: a per-request "now" is false and makes crawlers distrust it.
export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path.startsWith("/packages/") ? 0.8 : 0.6
  }));
}
