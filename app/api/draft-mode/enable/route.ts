import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { createSanityClient } from "../../../../sanity/lib/client";

/* Turns on draft preview for this browser only.

   - Sanity Studio's Presentation view sends a one-time secret that Studio
     stores in the dataset; it is checked against Sanity with the read token.
   - The older fixed-secret link (SANITY_PREVIEW_SECRET) keeps working.
   Anything else is refused, so ordinary visitors can never see drafts. */

const presentation = defineEnableDraftMode({
  client: createSanityClient({ preview: true, token: process.env.SANITY_API_READ_TOKEN })
});

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.has("sanity-preview-secret")) {
    if (!process.env.SANITY_API_READ_TOKEN) {
      return NextResponse.json({ error: "Draft preview is not configured." }, { status: 500 });
    }
    return presentation.GET(request);
  }

  const secret = url.searchParams.get("secret");
  const redirectTo = getSafeRedirectPath(url.searchParams.get("redirect") || url.searchParams.get("slug"));

  if (!process.env.SANITY_PREVIEW_SECRET || secret !== process.env.SANITY_PREVIEW_SECRET) {
    return NextResponse.json({ error: "Invalid preview secret." }, { status: 401 });
  }

  const store = await draftMode();
  store.enable();
  redirect(redirectTo);
}
