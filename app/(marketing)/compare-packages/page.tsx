import type { Metadata } from "next";
import ComparePackagesView from "./compare-packages-view";
import { getComparePackagesContentData } from "../../../lib/site-content";
import type { HomepageContent } from "../../../content/types";
import { draftMode } from "next/headers";

export const metadata: Metadata = {
  title: "Mason Company | Compare Retrofit Packages",
  description: "Compare the Mason Company Standard and Advanced retrofit washroom packages with a quiz-first package selection flow."
};

type SearchParams = {
  preview?: string | string[];
};

type PreviewState = "live" | "draft" | "draft-auth-required" | "draft-unavailable";

export default async function ComparePackagesPage({
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
      content = await getComparePackagesContentData();
      previewState = "draft-auth-required";
    } else {
      try {
        content = await getComparePackagesContentData({ preview: "draft", strict: true });
        previewState = "draft";
      } catch {
        content = await getComparePackagesContentData();
        previewState = "draft-unavailable";
      }
    }
  } else {
    content = await getComparePackagesContentData();
  }

  return <ComparePackagesView content={content} previewState={previewState} />;
}
