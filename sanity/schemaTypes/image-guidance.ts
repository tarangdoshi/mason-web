import { defineField } from "sanity";

type ImageSpec = {
  aspectRatio: string;
  minWidth: number;
  minHeight: number;
  crop: "cover" | "contain";
  matchingField?: string;
};

type ImageValue = {
  alt?: string;
  asset?: { _ref?: string };
};

function dimensionsFromAssetRef(value: unknown) {
  const ref = (value as ImageValue | undefined)?.asset?._ref;
  const match = ref?.match(/-(\d+)x(\d+)-[^-]+$/);
  return match ? { width: Number(match[1]), height: Number(match[2]) } : null;
}

function imageDescription(spec: ImageSpec, extra?: string) {
  const cropGuidance = spec.crop === "cover" ? "The saved crop and focal-point hotspot are respected." : "The complete image is kept visible.";
  const matchingGuidance = spec.matchingField ? " Use matching pixel dimensions for the paired image." : "";
  return `${extra ? `${extra} ` : ""}Recommended ${spec.aspectRatio}; minimum ${spec.minWidth}×${spec.minHeight}px. Alt text is required. ${cropGuidance}${matchingGuidance}`;
}

export function defineGuidedImageField({
  name,
  title,
  spec,
  description
}: {
  name: string;
  title: string;
  spec: ImageSpec;
  description?: string;
}) {
  return defineField({
    name,
    title,
    type: "imageWithAlt",
    description: imageDescription(spec, description),
    validation: (rule) => [
      rule.custom((value) => {
        const image = value as ImageValue | undefined;
        if (!image?.asset?._ref) return true;
        return image.alt?.trim() ? true : "Add descriptive alt text before publishing this image.";
      }),
      rule
        .custom((value) => {
          const dimensions = dimensionsFromAssetRef(value);
          if (!dimensions || (dimensions.width >= spec.minWidth && dimensions.height >= spec.minHeight)) return true;
          return `Upload at least ${spec.minWidth}×${spec.minHeight}px; this asset is ${dimensions.width}×${dimensions.height}px.`;
        })
        .warning(),
      rule
        .custom((value, context) => {
          if (!spec.matchingField) return true;
          const dimensions = dimensionsFromAssetRef(value);
          const pairedDimensions = dimensionsFromAssetRef((context.parent as Record<string, unknown> | undefined)?.[spec.matchingField]);
          if (!dimensions || !pairedDimensions) return true;
          return dimensions.width === pairedDimensions.width && dimensions.height === pairedDimensions.height
            ? true
            : `Use the same pixel dimensions as ${spec.matchingField} for predictable paired-image alignment.`;
        })
        .warning()
    ]
  });
}

export const cmsImageSpecs = {
  hero: { aspectRatio: "4:3 landscape", minWidth: 1200, minHeight: 900, crop: "cover" as const },
  landscape: { aspectRatio: "4:3 landscape", minWidth: 1200, minHeight: 900, crop: "cover" as const },
  package: { aspectRatio: "5:4 landscape", minWidth: 1200, minHeight: 960, crop: "cover" as const },
  process: { aspectRatio: "16:9 landscape", minWidth: 1280, minHeight: 720, crop: "cover" as const },
  portrait: { aspectRatio: "4:5 portrait", minWidth: 800, minHeight: 1000, crop: "cover" as const },
  social: { aspectRatio: "1.91:1 landscape", minWidth: 1200, minHeight: 630, crop: "cover" as const }
};
