import type { ContactSettings } from "@/lib/cms/model";

/** The one canonical public origin (apex and http variants permanently redirect here). */
export const SITE_URL = "https://www.masoncompany.in";
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Organization + WebSite JSON-LD for the home page (Google recommends one organization description on
 * the home or about page). Only verifiable facts: name, site, logo, the published support contact from
 * Sanity (Contact & Support), and the service area. Deliberately no address (Mason has no public
 * premises), no LocalBusiness, and no ratings, reviews, prices or credentials.
 */
export function organizationJsonLd(contact: ContactSettings) {
  const telephone = contact.phoneHref.replace(/^tel:/, "");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Mason Company",
        url: SITE_URL,
        logo: `${SITE_URL}/apple-icon.png`,
        description: "Bathroom safety assessments and installed bathroom safety upgrades for ageing parents in Goa, India.",
        email: contact.supportEmail,
        telephone,
        areaServed: { "@type": "State", name: "Goa", containedInPlace: { "@type": "Country", name: "India" } },
        contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", telephone, email: contact.supportEmail }]
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: "Mason Company",
        inLanguage: "en-IN",
        publisher: { "@id": ORGANIZATION_ID }
      }
    ]
  };
}

/** Serialises JSON-LD for a <script> tag; "<" is escaped so content can never close the tag. */
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
