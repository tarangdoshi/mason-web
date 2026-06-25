import { defineCliConfig } from "sanity/cli";
import { sanityDataset, sanityProjectId } from "./sanity/env";

export default defineCliConfig({
  api: {
    projectId: sanityProjectId || "missing-project-id",
    dataset: sanityDataset
  }
});
