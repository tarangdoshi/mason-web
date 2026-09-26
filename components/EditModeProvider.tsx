"use client";

import { createContext, useContext, type ReactNode } from "react";
import { editProps, type EditTarget } from "@/lib/cms/edit";

/* On only while previewing drafts from Sanity Studio. */
const EditModeContext = createContext(false);

export default function EditModeProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <EditModeContext.Provider value={enabled}>{children}</EditModeContext.Provider>;
}

/** `data-sanity` attributes for Sanity Presentation, or nothing on the public site. */
export function useEditProps(target: EditTarget) {
  return editProps(useContext(EditModeContext), target);
}
