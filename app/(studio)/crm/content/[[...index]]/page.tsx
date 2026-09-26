import SanityStudioClient from "./studio-client";

/* Sanity Studio for the public website.

   This route deliberately sits outside the (crm) route group: it does not
   use Mason CRM sign-in. Access is controlled by Sanity itself — Studio shows
   Sanity's login and only members of the Mason Sanity project (with their
   Sanity roles) can see or edit content. No Sanity token is used or exposed
   here; Studio authenticates each person with their own Sanity account.

   The Mason CRM (/crm and everything else under (crm)) keeps its own sign-in. */

export const dynamic = "force-static";

// Official Studio metadata/viewport from next-sanity (includes noindex).
export { metadata, viewport } from "next-sanity/studio";

export default function SanityStudioPage() {
  return <SanityStudioClient />;
}
