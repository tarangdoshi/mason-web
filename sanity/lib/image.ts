import { createImageUrlBuilder, type SanityImageSource } from "@sanity/image-url";
import { createSanityClient } from "./client";

const builder = createImageUrlBuilder(createSanityClient());

export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}
