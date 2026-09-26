import type { Metadata } from "next";
import { getPublicSiteContent } from "./load";
import type { SeoPageKey } from "./model";

/* Page metadata = the route's code defaults, with any SEO fields set in Sanity
   (Studio → SEO) layered on top. Canonical URLs, robots and routes always stay
   in code so an edit can never break indexing or point Google elsewhere. */
export async function cmsMetadata(key: SeoPageKey, defaults: Metadata): Promise<Metadata> {
  const entry = (await getPublicSiteContent()).seo[key];
  if (!entry) return defaults;

  const title = entry.title ?? (typeof defaults.title === "string" ? defaults.title : undefined);
  const description = entry.description ?? defaults.description ?? undefined;
  const socialTitle = entry.socialTitle ?? title;
  const socialDescription = entry.socialDescription ?? description;
  const images = entry.socialImage ? [entry.socialImage] : undefined;

  return {
    ...defaults,
    ...(title ? { title } : {}),
    ...(description ? { description } : {}),
    openGraph: {
      ...(defaults.openGraph ?? {}),
      ...(socialTitle ? { title: socialTitle } : {}),
      ...(socialDescription ? { description: socialDescription } : {}),
      ...(images ? { images } : {})
    },
    twitter: {
      ...(defaults.twitter ?? {}),
      ...(socialTitle ? { title: socialTitle } : {}),
      ...(socialDescription ? { description: socialDescription } : {}),
      ...(images ? { images } : {})
    }
  };
}
