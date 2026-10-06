import type { MetadataRoute } from "next";

const SITE_URL = "https://www.masoncompany.in";

/**
 * Crawlers whose only documented purpose is collecting content to train AI models. Each provider
 * documents a separate token for its search/answer crawler, which stays allowed by the "*" group, so
 * opting out of training does not remove Mason from those results (re-verified 2026-10-07):
 * - GPTBot: OpenAI training; ChatGPT search uses OAI-SearchBot (developers.openai.com/api/docs/bots).
 * - ClaudeBot: Anthropic training; Claude search uses Claude-SearchBot (support.claude.com, article 8896518).
 * - Applebot-Extended: Apple training only; "can still be included in search results" (support.apple.com/119829).
 * - CCBot: Common Crawl's open dataset, not a search engine (commoncrawl.org/ccbot).
 * Not listed, because blocking them could cost search/answer visibility (bias: discoverability):
 * - Google-Extended also governs grounding (citations) in Gemini Apps.
 * - meta-externalagent is documented for training "or improving products by indexing content directly",
 *   so it is not cleanly training-only.
 * Googlebot, Bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot, Applebot and meta-webindexer use "*".
 */
export const AI_TRAINING_CRAWLERS = ["GPTBot", "ClaudeBot", "Applebot-Extended", "CCBot"];

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
