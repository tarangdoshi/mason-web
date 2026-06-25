import type { MetadataRoute } from "next";

const SITE_URL = "https://www.masoncompany.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/crm"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
