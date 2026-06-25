import type { ImgHTMLAttributes } from "react";
import type { VisualAsset } from "../../content/types";

type CmsImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt" | "height" | "src" | "srcSet" | "width"> & {
  visual?: VisualAsset;
  fallbackSrc?: string;
  fallbackAlt: string;
  width: number;
  height: number;
};

export default function CmsImage({
  visual,
  fallbackSrc,
  fallbackAlt,
  width,
  height,
  sizes = "100vw",
  loading = "lazy",
  decoding = "async",
  style,
  ...props
}: CmsImageProps) {
  const src = visual?.src || fallbackSrc;
  if (!src) return null;

  return (
    <img
      {...props}
      src={src}
      srcSet={visual?.srcSet}
      sizes={visual?.srcSet ? sizes : undefined}
      alt={visual?.alt || fallbackAlt}
      width={visual?.width || width}
      height={visual?.height || height}
      loading={loading}
      decoding={decoding}
      style={{ ...style, ...(visual?.objectPosition ? { objectPosition: visual.objectPosition } : {}) }}
    />
  );
}
