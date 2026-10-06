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
        slogan: "Observe first. Recommend second. Sell last.",
        knowsAbout: [
          "Bathroom safety for older adults",
          "Bathroom safety assessment",
          "Grab bar placement and installation",
          "Anti-slip bathroom floors",
          "Safer bathing for older adults",
          "Toilet safety and sit-to-stand support"
        ],
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

const GOA = { "@type": "State", name: "Goa", containedInPlace: { "@type": "Country", name: "India" } };

type Crumb = { path: string; name: string };

function breadcrumb(path: string, name: string, parent?: Crumb) {
  const trail = [{ path: "", name: "Home" }, ...(parent ? [parent] : []), { path, name }];
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.path ? `${SITE_URL}${crumb.path}` : SITE_URL
    }))
  };
}

/** A bathroom safety solution Mason installs in Goa (grab bars, anti-slip, bathing, toilet support): a
    Service from the Organization, reached through the assessment. No prices (solutions are sold as packages). */
export function solutionJsonLd(input: { path: string; name: string; serviceType: string; description: string }) {
  const url = `${SITE_URL}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: input.name,
        serviceType: input.serviceType,
        provider: { "@id": ORGANIZATION_ID },
        areaServed: GOA,
        audience: { "@type": "PeopleAudience", audienceType: "Older adults and families of ageing parents" },
        description: input.description,
        url
      },
      breadcrumb(input.path, input.name, { path: "/bathroom-safety-assessment", name: "Bathroom safety assessment" })
    ]
  };
}

/** The free inspection: a Service from the home page's Organization, offered in Goa at no charge. */
export function assessmentJsonLd(description: string) {
  const url = `${SITE_URL}/bathroom-safety-assessment`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}#service`,
        name: "Bathroom safety assessment",
        serviceType: "Home bathroom safety assessment for ageing adults",
        provider: { "@id": ORGANIZATION_ID },
        areaServed: GOA,
        description,
        url,
        offers: { "@type": "Offer", price: 0, priceCurrency: "INR", description: "Free bathroom inspection" }
      },
      breadcrumb("/bathroom-safety-assessment", "Bathroom safety assessment")
    ]
  };
}

/** The guide: an Article authored and published by Mason Company (no individual author is claimed). */
export function guideJsonLd(input: { path: string; headline: string; description: string; published: string; citations: string[] }) {
  const url = `${SITE_URL}${input.path}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: input.headline,
        description: input.description,
        url,
        mainEntityOfPage: url,
        inLanguage: "en-IN",
        datePublished: input.published,
        dateModified: input.published,
        author: { "@id": ORGANIZATION_ID },
        publisher: { "@id": ORGANIZATION_ID },
        about: { "@type": "Thing", name: "Bathroom safety for older adults" },
        citation: input.citations
      },
      breadcrumb(input.path, "Bathroom safety for elderly parents")
    ]
  };
}
