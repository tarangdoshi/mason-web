import { fallbackSettings } from "./fallback";
import type { ContactSettings } from "./model";

/* Privacy Policy and Terms stay in code (reviewed changes only). The contact
   details inside them, though, are the same Contact & Support values shown
   everywhere else, so an edit in Sanity reaches the legal pages too. The
   documents are written with the fallback values; this swaps in the live ones. */
export function withContactDetails<T>(doc: T, contact: ContactSettings): T {
  const fb = fallbackSettings.contact;
  const swaps: [string, string][] = [
    [fb.phoneHref, contact.phoneHref],
    [fb.phoneDisplay, contact.phoneDisplay],
    [fb.supportEmail, contact.supportEmail],
    [fb.supportHours, contact.supportHours]
  ];
  const swap = (value: unknown): unknown => {
    if (typeof value === "string") return swaps.reduce((text, [from, to]) => text.split(from).join(to), value);
    if (Array.isArray(value)) return value.map(swap);
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, swap(item)]));
    return value;
  };
  return swap(doc) as T;
}
