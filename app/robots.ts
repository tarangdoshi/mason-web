import type { MetadataRoute } from "next";

const SITE_URL = "https://www.masoncompany.in";

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") return {rules: {userAgent:"*", disallow:"/"}};
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/crm", "/content-preview"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
