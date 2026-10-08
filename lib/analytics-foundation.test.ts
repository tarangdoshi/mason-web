import test from "node:test";
import assert from "node:assert/strict";
import { resetAnalyticsViewState, trackAnalyticsEvent } from "./analytics";
import { getLeadAttributionContext, storeLeadCtaContext } from "./lead-context";
import { createLeadFunnelTracker, FORM_NAMES } from "./lead-funnel";

/**
 * The analytics foundation: what a funnel event is allowed to say, and what it must
 * never say.
 *
 * These cover the three corrections this branch makes — a first-touch landing page that
 * survives navigation, click ids that are joinable in a report, and a refused submission
 * that is distinguishable from an abandoned one — plus the privacy rules all three sit
 * inside. Each failure mode here was reachable before.
 */

type Browser = {
  location: { href: string; origin: string; pathname: string; search: string };
  sessionStorage: { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void };
  crypto: { randomUUID(): string };
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: unknown;
  _fbq?: unknown;
  __masonGoogleTagConfigured?: boolean;
  __masonMetaPixelConfigured?: boolean;
};

const envKeys = [
  "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  "NEXT_PUBLIC_GOOGLE_ADS_ID",
  "NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL",
  "NEXT_PUBLIC_META_PIXEL_ID"
] as const;

const GA = { NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST123" };
const GA_ADS_META = {
  ...GA,
  NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-TEST",
  NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL: "leadlabel",
  NEXT_PUBLIC_META_PIXEL_ID: "1234567890"
};

function setUrl(browser: Browser, url: string) {
  const parsed = new URL(url);
  browser.location = { href: parsed.href, origin: parsed.origin, pathname: parsed.pathname, search: parsed.search };
}

type Harness = {
  browser: Browser;
  gtagCalls: unknown[][];
  fbqCalls: unknown[][];
  events(name: string): Record<string, unknown>[];
  navigateTo(url: string): void;
};

function withBrowser(url: string, env: Partial<Record<(typeof envKeys)[number], string>>, run: (harness: Harness) => void) {
  const storage = new Map<string, string>();
  const gtagCalls: unknown[][] = [];
  const fbqCalls: unknown[][] = [];
  const browser: Browser = {
    location: { href: "", origin: "", pathname: "", search: "" },
    sessionStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => void storage.set(key, value),
      removeItem: (key) => void storage.delete(key)
    },
    crypto: { randomUUID: () => "test-session" },
    gtag: (...args: unknown[]) => void gtagCalls.push(args)
  };
  browser.fbq = Object.assign((...args: unknown[]) => void fbqCalls.push(args), { queue: [] as unknown[] });
  setUrl(browser, url);

  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
  for (const key of envKeys) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  Object.defineProperty(globalThis, "window", { value: browser, configurable: true });
  Object.defineProperty(globalThis, "document", { value: { referrer: "", title: "Mason Company" }, configurable: true });
  resetAnalyticsViewState();

  try {
    run({
      browser,
      gtagCalls,
      fbqCalls,
      events: (name) => gtagCalls
        .filter((call) => call[0] === "event" && call[1] === name)
        .map((call) => call[2] as Record<string, unknown>),
      navigateTo: (next) => {
        setUrl(browser, next);
        // What LaunchAnalytics' ManualPageViews does on every pathname change.
        storeLeadCtaContext({});
      }
    });
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }
}

// ------------------------------------------------------- first-touch landing page

test("the landing page is the first page of the session and survives navigation", () => {
  withBrowser("https://www.masoncompany.in/solutions/grab-bars?utm_source=google&utm_medium=cpc", GA, ({ navigateTo }) => {
    storeLeadCtaContext({});
    navigateTo("https://www.masoncompany.in/packages");
    navigateTo("https://www.masoncompany.in/bathroom-safety-assessment");

    const attribution = getLeadAttributionContext({ entryPoint: "assessment-form" })!;

    assert.equal(attribution.landingPage, "/solutions/grab-bars", "the landing page is where the visit began");
    assert.equal(attribution.pagePath, "/bathroom-safety-assessment", "pagePath still answers where the form was submitted");
    // The whole point: both halves of the record now describe the same visit.
    assert.equal(attribution.utmSource, "google", "the first-touch campaign is unchanged");
    assert.equal(attribution.utmMedium, "cpc");
  });
});

test("a later campaign URL cannot overwrite the landing page or the campaign", () => {
  withBrowser("https://www.masoncompany.in/?utm_source=google&utm_campaign=first", GA, ({ navigateTo }) => {
    storeLeadCtaContext({});
    navigateTo("https://www.masoncompany.in/packages?utm_source=newsletter&utm_campaign=second");

    const attribution = getLeadAttributionContext()!;
    assert.equal(attribution.landingPage, "/");
    assert.equal(attribution.utmSource, "google");
    assert.equal(attribution.utmCampaign, "first");
  });
});

test("a form reached with no prior navigation treats its own page as the landing page", () => {
  withBrowser("https://www.masoncompany.in/contact", GA, () => {
    const attribution = getLeadAttributionContext({ entryPoint: "contact-form" })!;
    assert.equal(attribution.landingPage, "/contact");
  });
});

// --------------------------------------------------------------- click ids on events

const CAMPAIGN_URL = "https://www.masoncompany.in/?utm_source=google&utm_medium=cpc&utm_campaign=goa&utm_term=grab+bars"
  + "&utm_content=creative_01&gclid=Cj0abc123&gbraid=GB123&wbraid=WB123&fbclid=FB123";

test("generate_lead carries the click ids, so a click can be joined to an enquiry", () => {
  withBrowser(CAMPAIGN_URL, GA, ({ events }) => {
    storeLeadCtaContext({});
    createLeadFunnelTracker(FORM_NAMES.safetyVisit).leadCreated({
      leadId: "1272869000000878010",
      enquiryId: "3f8c1d2e-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
      locationMarket: "GOA"
    });

    const [lead] = events("generate_lead");
    assert.equal(lead.gclid, "Cj0abc123");
    assert.equal(lead.gbraid, "GB123");
    assert.equal(lead.wbraid, "WB123");
    assert.equal(lead.fbclid, "FB123");
    assert.equal(lead.utm_source, "google");
    assert.equal(lead.utm_medium, "cpc");
    assert.equal(lead.utm_campaign, "goa");
    assert.equal(lead.utm_content, "creative_01");
    assert.equal(lead.city, "Goa");
  });
});

test("the paid-search keyword reaches the CRM but never analytics", () => {
  // utm_term is normally several words, and a campaign parameter that admits spaces
  // would also admit a street address — which is exactly what the campaign-value guard
  // exists to refuse. So the keyword is carried to Zoho and withheld from GA4, rather
  // than the guard being loosened to fit it.
  withBrowser(CAMPAIGN_URL, GA, ({ events }) => {
    storeLeadCtaContext({});
    const attribution = getLeadAttributionContext()!;
    createLeadFunnelTracker(FORM_NAMES.safetyVisit).leadCreated({ leadId: "1272869000000878010", locationMarket: "GOA" });

    assert.equal(attribution.utmTerm, "grab bars", "the keyword is captured in full for the CRM");
    const [lead] = events("generate_lead");
    assert.equal(lead.utm_term, undefined, "the keyword is not an analytics parameter");
  });
});

test("a click id that looks like a person is dropped, not sent", () => {
  // Campaign URLs are outside Mason's control, so a click id is not trusted to be opaque.
  for (const hostile of ["someone@example.com", "9876543210", "+91 98765 43210"]) {
    withBrowser(`https://www.masoncompany.in/?gclid=${encodeURIComponent(hostile)}&utm_source=google`, GA, ({ events }) => {
      storeLeadCtaContext({});
      createLeadFunnelTracker(FORM_NAMES.contact).leadCreated({ leadId: "1272869000000878010", locationMarket: "GOA" });

      const [lead] = events("generate_lead");
      assert.equal(lead.gclid, undefined, `a gclid of "${hostile}" must never reach analytics`);
      assert.equal(lead.utm_source, "google", "a legitimate campaign value beside it still travels");
    });
  }
});

// ----------------------------------------------------------------- enquiry identity

test("generate_lead reports the enquiry and the CRM record as separate parameters", () => {
  withBrowser("https://www.masoncompany.in/bathroom-safety-assessment", GA, ({ events }) => {
    createLeadFunnelTracker(FORM_NAMES.safetyVisit).leadCreated({
      leadId: "1272869000000878010",
      enquiryId: "3f8c1d2e-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
      locationMarket: "GOA"
    });

    const [lead] = events("generate_lead");
    assert.equal(lead.enquiry_id, "3f8c1d2e-4a5b-6c7d-8e9f-0a1b2c3d4e5f");
    assert.equal(lead.lead_id, "1272869000000878010");
    assert.notEqual(lead.enquiry_id, lead.lead_id);
  });
});

test("an enquiry id that is not an opaque record id is dropped", () => {
  withBrowser("https://www.masoncompany.in/contact", GA, ({ events }) => {
    createLeadFunnelTracker(FORM_NAMES.contact).leadCreated({
      leadId: "1272869000000878010",
      enquiryId: "asha.test@example.com",
      locationMarket: "GOA"
    });

    const [lead] = events("generate_lead");
    assert.equal(lead.enquiry_id, undefined);
    assert.equal(lead.lead_id, "1272869000000878010", "the event is still reported");
  });
});

test("an API with no enquiryId yet still reports the lead", () => {
  // Backwards compatibility: mason-web may deploy before the API field exists.
  withBrowser("https://www.masoncompany.in/contact", GA, ({ events }) => {
    createLeadFunnelTracker(FORM_NAMES.contact).leadCreated({ leadId: "1272869000000878010", locationMarket: "GOA" });

    const [lead] = events("generate_lead");
    assert.equal(lead.enquiry_id, undefined);
    assert.equal(lead.lead_id, "1272869000000878010");
  });
});

test("one form instance reports one successful enquiry, however often it is told", () => {
  withBrowser("https://www.masoncompany.in/bathroom-safety-assessment", GA, ({ events }) => {
    const funnel = createLeadFunnelTracker(FORM_NAMES.safetyVisit);
    assert.equal(funnel.leadCreated({ leadId: "1", enquiryId: "e-1", locationMarket: "GOA" }), true);
    assert.equal(funnel.leadCreated({ leadId: "1", enquiryId: "e-1", locationMarket: "GOA" }), false);

    assert.equal(events("generate_lead").length, 1, "a duplicate success is never double-counted");
  });
});

// --------------------------------------------------------------------- form_error

test("a refused submission is reported with its category", () => {
  for (const category of ["validation", "server", "network"] as const) {
    withBrowser("https://www.masoncompany.in/bathroom-safety-assessment", GA, ({ events }) => {
      createLeadFunnelTracker(FORM_NAMES.safetyVisit).submitFailed(category);

      const [failure] = events("form_error");
      assert.equal(failure.error_category, category);
      assert.equal(failure.form_name, "Safety Visit Form");
    });
  }
});

test("form_error carries nothing but the fixed labels and page context", () => {
  withBrowser("https://www.masoncompany.in/contact", GA, ({ events }) => {
    createLeadFunnelTracker(FORM_NAMES.contact).submitFailed("server");

    const [failure] = events("form_error");
    const allowed = new Set(["form_name", "error_category", "page", "page_category", "entry_page", "city", "package_name"]);
    for (const key of Object.keys(failure)) {
      assert.ok(allowed.has(key), `form_error must not carry "${key}"`);
    }
    assert.equal(failure.page, "/contact");
  });
});

test("every refused attempt is reported, not just the first", () => {
  withBrowser("https://www.masoncompany.in/contact", GA, ({ events }) => {
    const funnel = createLeadFunnelTracker(FORM_NAMES.contact);
    funnel.submitFailed("validation");
    funnel.submitFailed("server");

    assert.equal(events("form_error").length, 2, "the submit-to-success gap is per attempt");
  });
});

test("a refused submission is never an advertising conversion", () => {
  withBrowser("https://www.masoncompany.in/contact", GA_ADS_META, ({ gtagCalls, fbqCalls }) => {
    createLeadFunnelTracker(FORM_NAMES.contact).submitFailed("server");

    const conversions = gtagCalls.filter((call) => call[0] === "event" && call[1] === "conversion");
    assert.equal(conversions.length, 0, "form_error must not report a Google Ads conversion");
    const metaTracks = fbqCalls.filter((call) => call[0] === "track" || call[0] === "trackCustom");
    assert.equal(metaTracks.length, 0, "form_error must not reach Meta");
  });
});

test("a success still reports the advertising conversion against the enquiry", () => {
  withBrowser("https://www.masoncompany.in/contact", GA_ADS_META, ({ gtagCalls }) => {
    createLeadFunnelTracker(FORM_NAMES.contact).leadCreated({
      leadId: "1272869000000878010", enquiryId: "e-1", locationMarket: "GOA"
    });

    const [conversion] = gtagCalls
      .filter((call) => call[0] === "event" && call[1] === "conversion")
      .map((call) => call[2] as Record<string, unknown>);
    assert.equal(conversion.send_to, "AW-TEST/leadlabel");
  });
});

// --------------------------------------------------------------------- PII guard

test("no funnel event can carry a customer detail, whatever it is handed", () => {
  withBrowser("https://www.masoncompany.in/contact", GA, ({ events }) => {
    trackAnalyticsEvent("generate_lead", {
      form_name: "Contact Form",
      // Everything below is a value the forms hold and must never report.
      utm_campaign: "asha.test@example.com",
      utm_source: "9876543210",
      utm_content: "12 Hidden Lane, Caranzalem",
      enquiry_id: "asha.test@example.com",
      lead_id: "+91 98765 43210"
    } as never);

    const [lead] = events("generate_lead");
    for (const [key, value] of Object.entries(lead)) {
      const text = String(value);
      assert.ok(!text.includes("@"), `${key} leaked an email-shaped value`);
      assert.ok(!/\d{10,}/.test(text.replace(/[\s()+._-]/g, "")), `${key} leaked a phone-shaped value`);
    }
    assert.equal(lead.utm_content, undefined, "an address is not a campaign value");
  });
});
