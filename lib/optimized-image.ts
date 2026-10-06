/* Responsive delivery for bundled site images that are rendered with a plain
   <img>/<picture> (the hero needs art direction, which next/image can't do).
   Routing them through Next's image optimiser gives the browser right-sized
   WebP candidates instead of one full-size JPEG. Widths are a subset of
   Next's default deviceSizes, which the optimiser accepts. Sanity images
   already carry their own CDN srcSet and are left alone. */
const WIDTHS = [640, 828, 1080, 1200, 1920] as const;

export function optimizedUrl(src: string, width: number, quality = 70): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** srcSet for a local `/…` image, or undefined for anything else. */
export function localSrcSet(src: string): string | undefined {
  if (!src.startsWith("/") || src.startsWith("//") || src.startsWith("/_next/")) return undefined;
  return WIDTHS.map((width) => `${optimizedUrl(src, width)} ${width}w`).join(", ");
}

/** The image with a responsive srcSet filled in when it is a bundled local file. */
export function withResponsiveSrc<T extends { src: string; srcSet?: string }>(image: T): T {
  if (image.srcSet) return image;
  const srcSet = localSrcSet(image.src);
  return srcSet ? { ...image, srcSet, src: optimizedUrl(image.src, 1080) } : image;
}
