import { isPreviewingDrafts } from "./load";
import { editProps, type EditTarget } from "./edit";

/** Server-component version of useEditProps: attributes only while previewing drafts. */
export async function serverEditProps(target: EditTarget) {
  return editProps(await isPreviewingDrafts(), target);
}
