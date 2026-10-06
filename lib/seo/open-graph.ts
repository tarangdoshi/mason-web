import type { Metadata } from "next";

/* A page that sets its own openGraph replaces the layout's whole object in Next.js metadata, so the
   share image and site name must be repeated here - otherwise links shared on WhatsApp and social
   apps show no picture. */
export const SHARE_IMAGE = "/prerna/images/hero-install.jpg";

export function pageOpenGraph(input: { title: string; description: string; url: string; type?: "website" | "article" }): Metadata["openGraph"] {
  return {
    type: input.type ?? "website",
    siteName: "Mason Company",
    locale: "en_IN",
    title: input.title,
    description: input.description,
    url: input.url,
    images: [SHARE_IMAGE]
  };
}
