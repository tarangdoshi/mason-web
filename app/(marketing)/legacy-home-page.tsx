import HomePageView from "../home-page-view";
import { getHomepageContentData } from "../../lib/site-content";
import type { HomepageContent } from "../../content/types";
import { draftMode } from "next/headers";

type SearchParams = {
  variant?: string | string[];
  preview?: string | string[];
};

type PreviewState = "live" | "draft" | "draft-auth-required" | "draft-unavailable";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const preview = Array.isArray(resolvedSearchParams?.preview) ? resolvedSearchParams.preview[0] : resolvedSearchParams?.preview;
  let content: HomepageContent;
  let previewState: PreviewState = "live";

  if (preview === "draft") {
    const draft = await draftMode();
    if (!draft.isEnabled) {
      content = await getHomepageContentData();
      previewState = "draft-auth-required";
    } else {
      try {
        content = await getHomepageContentData({ preview: "draft", strict: true });
        previewState = "draft";
      } catch {
        content = await getHomepageContentData();
        previewState = "draft-unavailable";
      }
    }
  } else {
    content = await getHomepageContentData();
  }

  return <HomePageView content={content} previewState={previewState} searchParams={searchParams} />;
}
