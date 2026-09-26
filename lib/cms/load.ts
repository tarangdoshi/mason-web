/* Server-side loading of public-site content from Sanity.

   - Published content for every normal visitor.
   - Draft content only when Next draft mode is on, which can only be switched
     on through /api/draft-mode/enable with a valid Sanity preview secret.
   - One fetch per request (React cache), shared by the page, layout pieces and
     generateMetadata.
   - Any failure resolves to the fallback content rather than breaking the page. */

import { cache } from "react";
import { draftMode } from "next/headers";
import { groq } from "next-sanity";
import { createSanityClient } from "../../sanity/lib/client";
import { urlForImage } from "../../sanity/lib/image";
import { hasSanityConfig } from "../../sanity/env";
import type { PublicSiteContent } from "./model";
import { resolvePublicSite, type RawPayload } from "./resolve";

const image = `{ alt, fallbackSrc, objectPosition, crop, hotspot, asset }`;

export const publicSiteQuery = groq`{
  "homepage": *[_id == "homepage"][0]{
    ...,
    hero{ ..., backgroundImage${image}, backgroundImageMobile${image} },
    whatWeDoSection{ ..., sideImage${image} },
    transformationGallerySection{ ..., sliderBefore${image}, sliderAfter${image}, tiles[]{ label, hidden, image${image} } },
    finalCtaSection{ ..., backgroundImage${image} }
  },
  "siteSettings": *[_id == "siteSettings"][0]{ ..., contactImage${image} },
  "gallery": *[_id == "gallery"][0]{ ..., sliderBefore${image}, sliderAfter${image}, tiles[]{ label, hidden, image${image} } },
  "faqs": *[_id == "faqs"][0],
  "packagesPage": *[_id == "packagesPage"][0]{ ..., image${image} },
  "aboutPage": *[_id == "aboutPage"][0]{
    ...,
    hero{ ..., image${image} },
    story{ ..., image${image} },
    team{ ..., founders[]{ ..., photo${image} } },
    approach{ ..., image${image} },
    closing{ ..., image${image} }
  },
  "seo": *[_id == "seo"][0]{
    "home": home{ ..., socialImage${image} },
    "about": about{ ..., socialImage${image} },
    "packages": packages{ ..., socialImage${image} },
    "packageStandard": packageStandard{ ..., socialImage${image} },
    "packageAdvanced": packageAdvanced{ ..., socialImage${image} },
    "contact": contact{ ..., socialImage${image} },
    "why": why{ ..., socialImage${image} },
    "privacy": privacy{ ..., socialImage${image} },
    "terms": terms{ ..., socialImage${image} }
  },
  "packages": *[_type == "package"]{
    code, badge, titleDescriptor, bestFor, outcome, priceInr, referencePriceInr, savings, ctaLabel, isFeatured, visualHighlights,
    "includedFeatures": includedFeatures[]->{ key, label, publicLabel, category, quantity, description, publicDescription, image${image} }
  },
  "testimonials": *[_type == "testimonial"] | order(sortOrder asc){ name, relation, city, quote, isHidden },
  "doctors": *[_type == "doctor"] | order(sortOrder asc){ name, specialty, registration, quote, isHidden, photo${image} }
}`;

type AssetImage = { asset?: { _ref?: string } | null; crop?: unknown; hotspot?: unknown; resolvedSrc?: string; resolvedSrcSet?: string };

/* One master image serves every device: the browser (or next/image) picks
   the smallest width that fills the slot, so phones never fetch the desktop
   file. Width-capped at 2400px; the crop the editor set is always applied. */
const RESPONSIVE_WIDTHS = [480, 828, 1200, 1920, 2400] as const;
const MASTER_WIDTH = 2400;

/** Adds resolvedSrc / resolvedSrcSet to every uploaded Sanity image so the
    pure resolver can treat assets and bundled files the same way. */
function attachImageUrls(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach(attachImageUrls);
    return;
  }
  const node = value as AssetImage & Record<string, unknown>;
  const ref = node.asset?._ref;
  if (typeof ref === "string" && ref.startsWith("image-")) {
    const source = { asset: { _ref: ref }, ...(node.crop ? { crop: node.crop } : {}), ...(node.hotspot ? { hotspot: node.hotspot } : {}) } as Parameters<typeof urlForImage>[0];
    const build = (width: number) => urlForImage(source).width(width).auto("format").quality(85).url();
    node.resolvedSrc = build(MASTER_WIDTH);
    node.resolvedSrcSet = RESPONSIVE_WIDTHS.map((width) => `${build(width)} ${width}w`).join(", ");
  }
  for (const child of Object.values(node)) attachImageUrls(child);
}

export async function isPreviewingDrafts() {
  try {
    return (await draftMode()).isEnabled;
  } catch {
    // Outside a request (build-time helpers, tests): never drafts.
    return false;
  }
}

async function fetchPayload(): Promise<RawPayload> {
  if (!hasSanityConfig()) return null;
  const preview = await isPreviewingDrafts();
  const token = preview ? process.env.SANITY_API_READ_TOKEN : undefined;
  // Draft mode without a read token cannot see drafts; show published content
  // rather than failing.
  const client = createSanityClient({ preview: Boolean(preview && token), token });
  try {
    const payload = await client.fetch<RawPayload>(publicSiteQuery);
    attachImageUrls(payload);
    return payload;
  } catch (error) {
    console.error("[cms] Sanity fetch failed; rendering fallback content.", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Resolved public-site content for the current request. */
export const getPublicSiteContent = cache(async (): Promise<PublicSiteContent> => resolvePublicSite(await fetchPayload()));
