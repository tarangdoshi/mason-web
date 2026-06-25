import { createClient } from "@sanity/client";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../env";

export function createSanityClient({
  preview = false,
  token
}: {
  preview?: boolean;
  token?: string;
} = {}) {
  return createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    useCdn: !preview,
    token,
    perspective: preview ? "drafts" : "published"
  });
}
