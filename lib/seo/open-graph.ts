import type { Metadata } from "next";

/* A page that sets its own openGraph replaces the layout's whole object in Next.js metadata, so the
   share image and site name must be repeated here - otherwise links shared on WhatsApp and social
   apps show no picture. */

/* WhatsApp is the strictest of the share surfaces and the one Mason links are pasted into most.
   It has no public spec, but two things are well established in practice and both were wrong before:

   - It drops the card for images much over ~300KB. The previous share image was a 1672x941 hero
     photo at 306KB, right on that edge.
   - It wants a 1.91:1 image and renders the large card most reliably when the dimensions and MIME
     type are declared in the markup, so it does not have to download the file to lay the card out.

   So the share image is a dedicated 1200x630 crop of the same genuine Mason install photo, at
   125KB, and every page declares width, height and type with it. */
export const SHARE_IMAGE = "/og/mason-share.jpg";
export const SHARE_IMAGE_WIDTH = 1200;
export const SHARE_IMAGE_HEIGHT = 630;
export const SHARE_IMAGE_TYPE = "image/jpeg";
export const SHARE_IMAGE_ALT = "A Mason technician fitting a grab bar in a bathroom while an elderly couple look on";

/* Declared as an object rather than a bare URL string so Next emits og:image:width, og:image:height
   and og:image:type alongside og:image. */
export const shareImage = {
  url: SHARE_IMAGE,
  width: SHARE_IMAGE_WIDTH,
  height: SHARE_IMAGE_HEIGHT,
  type: SHARE_IMAGE_TYPE,
  alt: SHARE_IMAGE_ALT
} as const;

/* `url` is the page's own address. Omit it only for the layout's fallback card: a layout cannot know
   which page it is rendering, and a fixed og:url there would tell Facebook and WhatsApp that every
   page without its own card is the homepage. Without og:url they use the URL that was shared. */
export function pageOpenGraph(input: { title: string; description: string; url?: string; type?: "website" | "article" }): Metadata["openGraph"] {
  return {
    type: input.type ?? "website",
    siteName: "Mason Company",
    locale: "en_IN",
    title: input.title,
    description: input.description,
    ...(input.url ? { url: input.url } : {}),
    images: [shareImage]
  };
}

/* The twitter card carries the same picture. summary_large_image is what makes the wide card, and
   is also what several in-app browsers fall back to when og tags are incomplete. */
export function pageTwitter(input: { title: string; description: string }): Metadata["twitter"] {
  return {
    card: "summary_large_image",
    title: input.title,
    description: input.description,
    images: [shareImage]
  };
}
