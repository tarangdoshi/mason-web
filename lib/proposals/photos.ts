/* Component photo URLs. Sanity's `auto=format` picks WebP/AVIF from the Accept header, which a shared CDN cache
   or an old browser (Safari before 14 has no WebP) can get wrong. So the page asks for formats explicitly: a
   WebP <source> for browsers that declare support, and a JPEG <img> that every browser (and the PDF canvas)
   can decode. Non-Sanity URLs (the test stand-in, data: URLs) are used as they are. */

const SANITY_IMAGE = /^https:\/\/cdn\.sanity\.io\/images\//;

export const isSanityImage = (url: string) => SANITY_IMAGE.test(url);

function withFormat(url: string, format: "jpg" | "webp"): string {
  const parsed = new URL(url);
  parsed.searchParams.delete("auto");
  parsed.searchParams.set("fm", format);
  if (format === "jpg") parsed.searchParams.set("q", "82");
  return parsed.toString();
}

/** The photo's sources: `webp` only for Sanity images; `jpeg` is always safe to put in an <img>. */
export function photoSources(url: string): { webp: string | null; jpeg: string } {
  if (!isSanityImage(url)) return { webp: null, jpeg: url };
  return { webp: withFormat(url, "webp"), jpeg: withFormat(url, "jpg") };
}

/** AbortSignal.timeout where it exists (Safari 16+), else an equivalent from AbortController. */
export function timeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}
