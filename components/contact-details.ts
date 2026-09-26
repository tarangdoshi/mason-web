/* Fallback contact details. The live values are edited in Sanity Studio
   (Contact & Support) and read through lib/cms; these only apply when Sanity is
   unavailable, and for the few code paths that run outside a page request.
   They come from the same fallback source, so the two can never disagree. */

import { fallbackSettings } from "../lib/cms/fallback";

/** Customer support email. */
export const CARE_EMAIL = fallbackSettings.contact.supportEmail;

/** Grouped 5-5 for display, matching the mobile placeholder in both forms. */
export const PHONE_DISPLAY = fallbackSettings.contact.phoneDisplay;
/** Unspaced - a tel: href with spaces in it will not dial. */
export const PHONE_HREF = fallbackSettings.contact.phoneHref;
export const WHATSAPP_URL = fallbackSettings.contact.whatsappUrl;

/** Customer support hours. */
export const HOURS = fallbackSettings.contact.supportHours;
