"use client";

import { createContext, useContext, type ReactNode } from "react";
import { fallbackSettings } from "@/lib/cms/fallback";
import type { SiteSettingsContent } from "@/lib/cms/model";

/* Contact & Support settings resolved on the server (from Sanity, with the
   fallback when absent), made available to the client components that sit in
   every page's chrome — Nav and Footer — without each page threading props. */

const SiteSettingsContext = createContext<SiteSettingsContent>(fallbackSettings);

export default function SiteSettingsProvider({ value, children }: { value: SiteSettingsContent; children: ReactNode }) {
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
