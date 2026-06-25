import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

function getSafeRedirectPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const redirectTo = getSafeRedirectPath(url.searchParams.get("redirect") || url.searchParams.get("slug"));

  if (!process.env.SANITY_PREVIEW_SECRET || secret !== process.env.SANITY_PREVIEW_SECRET) {
    return NextResponse.json({ error: "Invalid preview secret." }, { status: 401 });
  }

  const store = await draftMode();
  store.enable();
  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}preview=draft`);
}
