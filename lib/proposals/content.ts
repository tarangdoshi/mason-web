import { componentSeeds, templateSeed } from "../../content/proposals/seed";
import { createSanityClient } from "../../sanity/lib/client";
import { hasSanityConfig } from "../../sanity/env";
import type { ComponentContent, ProposalContent, TemplateContent } from "./document";

/* Proposal copy from Sanity. Customer pages read PUBLISHED documents only; staff preview ("Show family", share PDF)
   reads drafts over published, so a template still in review can be checked before it goes live. */

export const TEMPLATE_VERSION = "v1";

const TEMPLATE_QUERY = `*[_type == "proposalTemplate" && version == $version][0]`;
const COMPONENTS_QUERY = `*[_type == "componentLibrary" && defined(key)]{ key, benefitLine, "photoUrl": photos[0].asset->url }`;

/** Playwright only: the bundled approved copy instead of Sanity. Ignored in production builds. */
function seedContent(): ProposalContent {
  return {
    template: templateSeed,
    components: Object.fromEntries(Object.entries(componentSeeds).map(([key, seed]) => [key, { benefitLine: seed.benefitLine, photoUrl: null }]))
  };
}

const sized = (url: string | null | undefined) => (url ? `${url}?w=320&h=320&fit=crop&auto=format` : null);

/** Null when no template is available (customer pages then 404 until the template is published). */
export async function loadProposalContent({ preview }: { preview: boolean }): Promise<ProposalContent | null> {
  if (process.env.NODE_ENV !== "production" && process.env.PROPOSALS_CONTENT_SOURCE === "seed") return seedContent();
  if (!hasSanityConfig()) return null;
  const token = preview ? process.env.SANITY_API_READ_TOKEN : undefined;
  if (preview && !token) throw new Error("SANITY_API_READ_TOKEN is required for proposal preview.");
  const client = createSanityClient({ preview, token });
  const [template, components] = await Promise.all([
    client.fetch<TemplateContent | null>(TEMPLATE_QUERY, { version: TEMPLATE_VERSION }, { cache: "no-store" }),
    client.fetch<({ key: string } & ComponentContent)[]>(COMPONENTS_QUERY, {}, { cache: "no-store" })
  ]);
  if (!template) return null;
  return {
    template,
    components: Object.fromEntries(components.map((item) => [item.key, { benefitLine: item.benefitLine ?? null, photoUrl: sized(item.photoUrl) }]))
  };
}
