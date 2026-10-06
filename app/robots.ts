import type { MetadataRoute } from "next";

const SITE_URL = "https://www.masoncompany.in";

/**
 * Crawlers whose only documented purpose is collecting content to train AI models. Each provider
 * documents a separate token for its search/answer crawler, which stays allowed by the "*" group, so
 * opting out of training does not remove Mason from those results (verified 2026-10-06):
 * - GPTBot: OpenAI training; ChatGPT search uses OAI-SearchBot (developers.openai.com/api/docs/bots).
 * - ClaudeBot: Anthropic training; Claude search uses Claude-SearchBot (support.claude.com, article 8896518).
 * - Applebot-Extended: Apple training only; "can still be included in search results" (support.apple.com/119829).
 * - meta-externalagent: Meta training; Meta AI search uses meta-webindexer (developers.facebook.com web crawlers).
 * - CCBot: Common Crawl's open dataset, not a search engine (commoncrawl.org/ccbot).
 * Google-Extended is deliberately not listed: it also governs grounding (citations) in Gemini Apps.
 * Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot and Applebot use the "*" group.
 */
export const AI_TRAINING_CRAWLERS = ["GPTBot", "ClaudeBot", "Applebot-Extended", "meta-externalagent", "CCBot"];

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV === "preview") return {rules: {userAgent:"*", disallow:"/"}};
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/crm", "/content-preview", "/communications", "/operations"],
      },
      { userAgent: AI_TRAINING_CRAWLERS, disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
