import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  markViewedOnce,
  parsePackagePrice,
  resetAnalyticsViewState,
  setAnalyticsMarket,
  syncAnalyticsRouteVisit,
  trackAnalyticsEvent,
  trackPageView
} from "./analytics";
import { getLeadAttributionContext, readCampaignFromSearch, storeLeadCtaContext } from "./lead-context";
import { createLeadFunnelTracker, createSubmitAttemptTracker, FORM_NAMES, isFormFieldEvent } from "./lead-funnel";
import { submitGuidanceLead } from "./lead-submission";
import { homepageContent } from "../content/homepage.content";
import PackageCheckoutLink from "../app/components/package-checkout-link";
import { trackElementClick } from "../app/components/launch-analytics";

// jsdom executes native form constraint validation, including the case where
// an invalid form never receives a submit event.
const { JSDOM } = require("jsdom");

/* A minimal browser: location, sessionStorage, document, and a gtag/fbq that
   record what they were given. */
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

function setUrl(browser: Browser, url: string) {
  const parsed = new URL(url);
  browser.location = { href: parsed.href, origin: parsed.origin, pathname: parsed.pathname, search: parsed.search };
}

function withBrowser(url: string, env: Partial<Record<(typeof envKeys)[number], string>>, run: (browser: Browser, gtagCalls: unknown[][], fbqCalls: unknown[][]) => void) {
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
  const fbq = Object.assign((...args: unknown[]) => void fbqCalls.push(args), { queue: [] as unknown[] });
  browser.fbq = fbq;
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
    run(browser, gtagCalls, fbqCalls);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }
}

const GA = { NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-TEST123" };

function events(gtagCalls: unknown[][], name: string) {
  return gtagCalls.filter((call) => call[0] === "event" && call[1] === name).map((call) => call[2] as Record<string, unknown>);
}

// ---------------------------------------------------------------- attribution

test("every required campaign parameter is captured from the landing URL", () => {
  const campaign = readCampaignFromSearch(
    "?utm_source=google&utm_medium=cpc&utm_campaign=google_search_bangalore&utm_term=grab+bar&utm_content=creative_01&gclid=G1&gbraid=GB1&wbraid=WB1&fbclid=F1&unrelated=x"
  );
  assert.deepEqual(campaign, {
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "google_search_bangalore",
    utmTerm: "grab bar",
    utmContent: "creative_01",
    gclid: "G1",
    gbraid: "GB1",
    wbraid: "WB1",
    fbclid: "F1"
  });
});

test("a URL with no campaign parameters carries no attribution", () => {
  assert.equal(readCampaignFromSearch("?page=2"), null);
  assert.equal(readCampaignFromSearch(""), null);
  assert.equal(readCampaignFromSearch("?utm_source=&gclid=%20%20"), null);
});

test("malformed campaign values are cleaned and bounded, never thrown", () => {
  const campaign = readCampaignFromSearch(`?utm_source=%00google%0A&utm_campaign=${"c".repeat(600)}`);
  assert.equal(campaign?.utmSource, "google");
  assert.equal(campaign?.utmCampaign?.length, 255);
});

test("the original campaign survives navigation to the form and a later submit", () => {
  withBrowser("https://www.masoncompany.in/?utm_source=google&utm_medium=cpc&utm_campaign=launch&utm_content=hero&gbraid=GB1", {}, (browser) => {
    storeLeadCtaContext({});
    setUrl(browser, "https://www.masoncompany.in/packages");
    storeLeadCtaContext({});
    setUrl(browser, "https://www.masoncompany.in/contact");
    storeLeadCtaContext({ entryPoint: "contact-form" });

    const attribution = getLeadAttributionContext();
    assert.equal(attribution?.utmSource, "google");
    assert.equal(attribution?.utmMedium, "cpc");
    assert.equal(attribution?.utmCampaign, "launch");
    assert.equal(attribution?.utmContent, "hero");
    assert.equal(attribution?.gbraid, "GB1");
    assert.equal(attribution?.pagePath, "/contact");
  });
});

test("a second campaign URL in the same session neither replaces nor mixes into the original", () => {
  withBrowser("https://www.masoncompany.in/?utm_source=google&utm_medium=cpc&utm_campaign=first&gclid=G1", {}, (browser) => {
    storeLeadCtaContext({});
    setUrl(browser, "https://www.masoncompany.in/packages?utm_source=meta&utm_content=reel&fbclid=F2");
    storeLeadCtaContext({});

    const attribution = getLeadAttributionContext();
    assert.equal(attribution?.utmSource, "google");
    assert.equal(attribution?.utmCampaign, "first");
    assert.equal(attribution?.gclid, "G1");
    assert.equal(attribution?.utmContent, undefined);
    assert.equal(attribution?.fbclid, undefined);
  });
});

test("attribution reaches the guidance submission body unchanged", async () => {
  let sentBody: Record<string, unknown> | null = null;
  const attribution = { entryPoint: "assessment-form", utmSource: "google", utmCampaign: "launch", gclid: "G1", gbraid: "GB1" };
  const result = await submitGuidanceLead(
    { customerName: "Test", metadata: { source: "assessment-form", attribution } },
    (async (_url: string, init: RequestInit) => {
      sentBody = JSON.parse(String(init.body));
      return new Response(JSON.stringify({ data: { id: "1272869000000999001", locationMarket: "GOA" } }), { status: 201 });
    }) as typeof fetch
  );

  assert.equal(result.ok, true);
  assert.deepEqual((sentBody as unknown as { metadata: { attribution: unknown } }).metadata.attribution, attribution);
});

test("every lead form sends the stored attribution through the Mason API proxy", () => {
  const sources = [
    "app/components/assessment-lead-form.tsx",
    "components/ContactForm.tsx",
    "app/(marketing)/checkout/components/checkout-experience.tsx"
  ].map((file) => readFileSync(resolve(process.cwd(), file), "utf8"));
  for (const source of sources) {
    assert.match(source, /attribution: getLeadAttributionContext\(/);
  }
  const proxy = readFileSync(resolve(process.cwd(), "app/api/leads/guidance/route.ts"), "utf8");
  assert.match(proxy, /apiFetch\("\/api\/v1\/public\/leads\/guidance"/);
  assert.match(proxy, /body\s*\n?\s*}\)/);
});

// ------------------------------------------------------------ funnel events

test("form_submit is an attempt; generate_lead waits for the API's success", () => {
  withBrowser("https://www.masoncompany.in/packages", GA, (_browser, gtagCalls) => {
    const funnel = createLeadFunnelTracker(FORM_NAMES.safetyVisit);
    funnel.start({ packageName: "Standard" });
    funnel.submitAttempt({ packageName: "Standard" });

    assert.equal(events(gtagCalls, "form_submit").length, 1);
    assert.equal(events(gtagCalls, "generate_lead").length, 0, "a submit attempt alone is not a lead");

    funnel.submitAttempt({ packageName: "Standard" });
    assert.equal(events(gtagCalls, "form_submit").length, 2, "each retry after a failure is a new attempt");
    assert.equal(events(gtagCalls, "generate_lead").length, 0, "a failed lead creation never emits generate_lead");
  });
});

test("generate_lead fires once after success with the spreadsheet parameters", () => {
  withBrowser("https://www.masoncompany.in/?utm_source=google&utm_medium=cpc&utm_campaign=launch&utm_content=hero", GA, (browser, gtagCalls) => {
    storeLeadCtaContext({});
    setUrl(browser, "https://www.masoncompany.in/packages");
    const funnel = createLeadFunnelTracker(FORM_NAMES.safetyVisit);

    assert.equal(funnel.leadCreated({ leadId: "1272869000000999001", locationMarket: "BANGALORE", packageName: "Advanced" }), true);
    assert.equal(funnel.leadCreated({ leadId: "1272869000000999001", locationMarket: "BANGALORE", packageName: "Advanced" }), false);

    const leads = events(gtagCalls, "generate_lead");
    assert.equal(leads.length, 1);
    assert.equal(leads[0].lead_id, "1272869000000999001");
    assert.equal(leads[0].form_name, "Safety Visit Form");
    assert.equal(leads[0].package_name, "Advanced");
    assert.equal(leads[0].city, "Bangalore");
    assert.equal(leads[0].utm_source, "google");
    assert.equal(leads[0].utm_medium, "cpc");
    assert.equal(leads[0].utm_campaign, "launch");
    assert.equal(leads[0].utm_content, "hero");
  });
});

test("form_start fires once however many fields are touched", () => {
  withBrowser("https://www.masoncompany.in/contact", GA, (_browser, gtagCalls) => {
    const funnel = createLeadFunnelTracker(FORM_NAMES.contact);
    funnel.start();
    funnel.start();
    funnel.start({ packageName: "Standard" });
    const starts = events(gtagCalls, "form_start");
    assert.equal(starts.length, 1);
    assert.equal(starts[0].form_name, "Contact Form");
  });
});

test("only field interactions count towards form_start", () => {
  assert.equal(isFormFieldEvent({ target: { tagName: "INPUT" } as unknown as EventTarget }), true);
  assert.equal(isFormFieldEvent({ target: { tagName: "select" } as unknown as EventTarget }), true);
  assert.equal(isFormFieldEvent({ target: { tagName: "BUTTON" } as unknown as EventTarget }), false);
  assert.equal(isFormFieldEvent({ target: null }), false);
});

test("package_name is limited to the two real packages", () => {
  withBrowser("https://www.masoncompany.in/contact", GA, (_browser, gtagCalls) => {
    createLeadFunnelTracker(FORM_NAMES.contact).submitAttempt({ packageName: "Not sure yet" });
    assert.equal(events(gtagCalls, "form_submit")[0].package_name, undefined);
  });
});

test("forms wire each funnel step to the right moment", () => {
  const assessment = readFileSync(resolve(process.cwd(), "app/components/assessment-lead-form.tsx"), "utf8");
  const contact = readFileSync(resolve(process.cwd(), "components/ContactForm.tsx"), "utf8");
  for (const source of [assessment, contact]) {
    // generate_lead sits in the success branch, immediately after the gate completes.
    assert.match(source, /complete\(\);[\s\S]{0,40}\n?\s*.*leadCreated\(/);
    assert.match(source, /submitAttempt\(/);
  }
});

test("browser submit clicks count once with native validation, and retries count again", () => {
  const forms = [
    "app/components/assessment-lead-form.tsx",
    "components/ContactForm.tsx",
    "app/(marketing)/checkout/components/checkout-experience.tsx"
  ];
  for (const file of forms) {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    assert.match(source, /submitClick\(trackSubmitAttempt\)/, `${file} must count button clicks`);
    assert.match(source, /submitEvent\(trackSubmitAttempt\)/, `${file} must deduplicate submit events`);
  }

  for (const [caseName, name, email, expectedSubmitEvent] of [
    ["valid", "Asha Nair", "asha@example.test", true],
    ["missing required field", "", "asha@example.test", false],
    ["invalid email", "Asha Nair", "not-an-email", false]
  ] as const) {
    withBrowser("https://www.masoncompany.in/contact", GA, (_browser, gtagCalls) => {
      const dom = new JSDOM('<form><input name="name" required><input name="email" type="email" required><button type="submit">Send</button></form>');
      const form = dom.window.document.querySelector("form") as HTMLFormElement;
      const button = form.querySelector("button") as HTMLButtonElement;
      (form.elements.namedItem("name") as HTMLInputElement).value = name;
      (form.elements.namedItem("email") as HTMLInputElement).value = email;
      const intent = createSubmitAttemptTracker();
      const funnel = createLeadFunnelTracker(FORM_NAMES.contact);
      let submitEvents = 0;
      form.addEventListener("click", (event: Event) => {
        if (event.target === button) intent.submitClick(() => funnel.submitAttempt());
      });
      form.addEventListener("submit", (event: Event) => {
        event.preventDefault();
        submitEvents += 1;
        intent.submitEvent(() => funnel.submitAttempt());
      });

      form.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      assert.equal(events(gtagCalls, "form_submit").length, 0, `${caseName}: field interaction is not a submit`);
      button.click();
      assert.equal(submitEvents, expectedSubmitEvent ? 1 : 0, caseName);
      assert.equal(events(gtagCalls, "form_submit").length, 1, `${caseName}: exactly one attempt`);
      if (expectedSubmitEvent) {
        button.click(); // The first network request failed; the user retries.
        assert.equal(events(gtagCalls, "form_submit").length, 2);
      }
      dom.window.close();
    });
  }
});

test("checkout DB success keeps review UX without a paid lead conversion", () => {
  const checkout = readFileSync(resolve(process.cwd(), "app/(marketing)/checkout/components/checkout-experience.tsx"), "utf8");
  assert.doesNotMatch(checkout, /leadCreated\(/);
  assert.match(checkout, /trackAnalyticsEvent\("checkout_lead_submit_success"/);
  assert.match(checkout, /checkoutLeadIdRef\.current = payload\.data\?\.id \|\| "captured"/);
  assert.match(checkout, /setReviewState\(reviewPayload\)/);

  withBrowser("https://www.masoncompany.in/checkout/package-standard", {
    ...GA, NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-1", NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL: "lead", NEXT_PUBLIC_META_PIXEL_ID: "123"
  }, (_browser, gtagCalls, fbqCalls) => {
    createLeadFunnelTracker(FORM_NAMES.checkout).submitAttempt({ packageName: "Standard" });
    trackAnalyticsEvent("checkout_lead_submit_success", { package: "package-standard", cta_location: "checkout-review", section: "checkout" });
    assert.equal(events(gtagCalls, "form_submit").length, 1);
    assert.equal(events(gtagCalls, "checkout_lead_submit_success").length, 1);
    assert.equal(events(gtagCalls, "generate_lead").length, 0);
    assert.equal(events(gtagCalls, "conversion").length, 0);
    assert.equal(fbqCalls.filter((call) => call[1] === "Lead").length, 0);
  });
});

// ------------------------------------------------------ page and view events

test("page_view fires once per navigation, not per effect re-run", () => {
  withBrowser("https://www.masoncompany.in/?utm_source=google&secret=drop-me", GA, (browser, gtagCalls) => {
    assert.equal(trackPageView(1000), true);
    assert.equal(trackPageView(1001), false, "Strict Mode / remount repeat is ignored");
    setUrl(browser, "https://www.masoncompany.in/packages");
    assert.equal(trackPageView(1500), true);

    const views = events(gtagCalls, "page_view");
    assert.equal(views.length, 2);
    assert.equal(views[0].page_location, "https://www.masoncompany.in/?utm_source=google");
    assert.equal(views[0].page_title, "Mason Company");
    assert.equal(views[1].page, "/packages");
  });
});

test("gtag is configured before the first event is queued", () => {
  withBrowser("https://www.masoncompany.in/", GA, (browser, gtagCalls) => {
    browser.gtag = undefined;
    trackPageView(1000);
    const queued = (browser.dataLayer ?? []).map((args) => Array.from(args as ArrayLike<unknown>));
    assert.equal(queued[0][0], "js");
    assert.deepEqual(queued[1], ["config", "G-TEST123", { send_page_view: false }]);
    assert.equal(queued[2][0], "event");
    assert.equal(queued[2][1], "page_view");
    assert.equal(gtagCalls.length, 0);
  });
});

test("each package or service view counts once per page view", () => {
  withBrowser("https://www.masoncompany.in/", GA, (browser) => {
    trackPageView(1000);
    assert.equal(markViewedOnce("/:view_package:Standard"), true);
    assert.equal(markViewedOnce("/:view_package:Standard"), false);
    setUrl(browser, "https://www.masoncompany.in/packages");
    trackPageView(5000);
    assert.equal(markViewedOnce("/packages:view_package:Standard"), true);
  });
});

test("an observer view before deferred page_view remains deduplicated on the same visit", () => {
  withBrowser("https://www.masoncompany.in/", GA, (browser) => {
    trackPageView(1000);
    setUrl(browser, "https://www.masoncompany.in/packages/standard");
    assert.equal(markViewedOnce("/packages/standard:view_package:Standard"), true);
    syncAnalyticsRouteVisit("/packages/standard"); // Navigation effect runs after the observer.
    trackPageView(2000);
    assert.equal(markViewedOnce("/packages/standard:view_package:Standard"), false);
  });
});

test("A to B to A creates a new view on the return visit", () => {
  withBrowser("https://www.masoncompany.in/packages/standard", GA, (browser, gtagCalls) => {
    const view = (name: string) => {
      if (markViewedOnce(`${browser.location.pathname}:view_package:${name}`)) {
        trackAnalyticsEvent("view_package", { package_name: name });
      }
    };
    syncAnalyticsRouteVisit("/packages/standard");
    view("Standard");
    trackPageView(1000);
    setUrl(browser, "https://www.masoncompany.in/packages/advanced");
    syncAnalyticsRouteVisit("/packages/advanced");
    view("Advanced");
    trackPageView(2000);
    setUrl(browser, "https://www.masoncompany.in/packages/standard");
    syncAnalyticsRouteVisit("/packages/standard");
    trackPageView(3000);
    view("Standard");
    assert.deepEqual(events(gtagCalls, "view_package").map((event) => event.package_name), ["Standard", "Advanced", "Standard"]);
    assert.equal(events(gtagCalls, "page_view").length, 3);
    assert.match(readFileSync(resolve(process.cwd(), "app/components/launch-analytics.tsx"), "utf8"), /syncAnalyticsRouteVisit\(pathname\)/);
  });
});

test("same-route remount without navigation does not create another view", () => {
  withBrowser("https://www.masoncompany.in/packages/standard", GA, () => {
    syncAnalyticsRouteVisit("/packages/standard");
    assert.equal(markViewedOnce("/packages/standard:view_service:Safety Assessment"), true);
    trackPageView(1000);
    syncAnalyticsRouteVisit("/packages/standard"); // Remounted navigation effect.
    trackPageView(5000);
    assert.equal(markViewedOnce("/packages/standard:view_service:Safety Assessment"), false);
  });
});

test("the same entity can be viewed once on each different route", () => {
  withBrowser("https://www.masoncompany.in/", GA, (browser) => {
    syncAnalyticsRouteVisit("/");
    assert.equal(markViewedOnce("/:view_package:Standard"), true);
    assert.equal(markViewedOnce("/:view_package:Standard"), false);
    setUrl(browser, "https://www.masoncompany.in/packages");
    // The observer may run before the navigation effect and must still advance.
    assert.equal(markViewedOnce("/packages:view_package:Standard"), true);
    syncAnalyticsRouteVisit("/packages");
    assert.equal(markViewedOnce("/packages:view_package:Standard"), false);
  });
});

test("homepage and comparison package CTAs emit current Standard and Advanced prices", () => {
  for (const file of ["app/home-page-view.tsx", "app/(marketing)/compare-packages/compare-packages-view.tsx"]) {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    assert.match(source, /packagePrice=\{plan\.currentPrice \|\| plan\.price\}/);
  }
  for (const [name, expectedPrice] of [["Standard", 30000], ["Advanced", 37000]] as const) {
    const plan = homepageContent.packagesSection.plans.find((item) => item.name === name);
    assert.ok(plan);
    const sellingPrice = plan.currentPrice || plan.price;
    assert.equal(parsePackagePrice(sellingPrice), expectedPrice);
    Object.defineProperty(globalThis, "React", { value: React, configurable: true });
    const markup = renderToStaticMarkup(React.createElement(PackageCheckoutLink, {
      href: `/checkout/${plan.id}`, entryPoint: "package-card", pageSection: "packages", ctaId: `book-${plan.id}`,
      packageCode: plan.id, packageName: plan.name, packagePrice: sellingPrice
    } as React.ComponentProps<typeof PackageCheckoutLink>, `Continue with ${name}`));
    const dom = new JSDOM(markup);
    const anchor = dom.window.document.querySelector("a") as HTMLAnchorElement;
    assert.equal(anchor.dataset.analyticsPackagePrice, sellingPrice);
    Object.defineProperty(globalThis, "HTMLAnchorElement", { value: dom.window.HTMLAnchorElement, configurable: true });
    try {
      withBrowser("https://www.masoncompany.in/", GA, (_browser, gtagCalls) => {
        trackElementClick(anchor);
        assert.deepEqual(events(gtagCalls, "select_package").map((event) => [event.package_name, event.package_price]), [[name, expectedPrice]]);
      });
    } finally {
      Reflect.deleteProperty(globalThis, "HTMLAnchorElement");
      Reflect.deleteProperty(globalThis, "React");
      dom.window.close();
    }
  }
});

test("city is attached once the market is known, and omitted before", () => {
  withBrowser("https://www.masoncompany.in/", GA, (_browser, gtagCalls) => {
    trackAnalyticsEvent("view_package", { package_name: "Standard", package_price: 30000 });
    setAnalyticsMarket("UNKNOWN");
    trackAnalyticsEvent("view_package", { package_name: "Standard", package_price: 30000 });
    setAnalyticsMarket("GOA");
    trackAnalyticsEvent("select_package", { package_name: "Standard", package_price: parsePackagePrice("₹30,000") });

    const [first, second] = events(gtagCalls, "view_package");
    assert.equal(first.city, undefined);
    assert.equal(second.city, undefined);
    const selected = events(gtagCalls, "select_package")[0];
    assert.equal(selected.city, "Goa");
    assert.equal(selected.package_price, 30000);
  });
});

// ----------------------------------------------------------- privacy/safety

test("contact details never reach analytics parameters", () => {
  withBrowser("https://www.masoncompany.in/", GA, (_browser, gtagCalls) => {
    trackAnalyticsEvent("generate_lead", {
      form_name: "Safety Visit Form",
      lead_id: "person@example.com",
      utm_source: "someone@example.com",
      utm_campaign: "call 98765 43210",
      utm_medium: "cpc"
    });
    const lead = events(gtagCalls, "generate_lead")[0];
    assert.equal(lead.lead_id, undefined);
    assert.equal(lead.utm_source, undefined);
    assert.equal(lead.utm_campaign, undefined);
    assert.equal(lead.utm_medium, "cpc");
    for (const key of Object.keys(lead)) {
      assert.ok(["page", "form_name", "utm_medium"].includes(key), `unexpected key ${key}`);
    }
  });
});

test("campaign URL and event values keep safe attribution but exclude contact details", () => {
  withBrowser("https://www.masoncompany.in/?utm_source=asha%40example.test&utm_medium=cpc&utm_campaign=98765-43210&utm_content=launch_01&unapproved=drop", GA, (_browser, gtagCalls) => {
    trackPageView(1000);
    const page = events(gtagCalls, "page_view")[0];
    assert.equal(page.page_location, "https://www.masoncompany.in/?utm_medium=cpc&utm_content=launch_01");
    assert.equal(JSON.stringify(page).includes("asha"), false);
    assert.equal(JSON.stringify(page).includes("98765"), false);
    assert.equal(JSON.stringify(page).includes("unapproved"), false);

    trackAnalyticsEvent("generate_lead", {
      form_name: "Safety Visit Form", utm_source: "asha@example.test", utm_campaign: "98765-43210", utm_medium: "cpc",
      utm_content: "123 Main Street", lead_id: "zoho-id"
    });
    const lead = events(gtagCalls, "generate_lead")[0];
    assert.equal(lead.utm_source, undefined);
    assert.equal(lead.utm_campaign, undefined);
    assert.equal(lead.utm_content, undefined);
    assert.equal(lead.utm_medium, "cpc");

    trackAnalyticsEvent("page_view", {
      page: "/", page_location: "https://www.masoncompany.in/?utm_source=another%40example.test&utm_campaign=98765.43210&utm_medium=cpc"
    });
    const directPage = events(gtagCalls, "page_view")[1];
    assert.equal(directPage.page_location, "https://www.masoncompany.in/?utm_medium=cpc");
  });
});

test("a failing analytics destination cannot break the caller", () => {
  withBrowser("https://www.masoncompany.in/", { ...GA, NEXT_PUBLIC_META_PIXEL_ID: "123" }, (browser) => {
    browser.gtag = () => {
      throw new Error("blocked by an ad blocker");
    };
    browser.fbq = () => {
      throw new Error("pixel failed");
    };
    assert.doesNotThrow(() => createLeadFunnelTracker(FORM_NAMES.safetyVisit).leadCreated({ leadId: "1", locationMarket: "GOA" }));
    assert.doesNotThrow(() => trackPageView(1000));
  });
});

test("GA4 or Google Ads failure still attempts the other destinations", () => {
  for (const failingEvent of ["generate_lead", "conversion"]) {
    withBrowser("https://www.masoncompany.in/", {
      ...GA, NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-1", NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL: "lead", NEXT_PUBLIC_META_PIXEL_ID: "123"
    }, (browser, _gtagCalls, fbqCalls) => {
      const attempts: string[] = [];
      browser.__masonGoogleTagConfigured = true;
      browser.gtag = (...args: unknown[]) => {
        if (args[0] === "event") attempts.push(String(args[1]));
        if (args[1] === failingEvent) throw new Error(`${failingEvent} failed`);
      };
      assert.doesNotThrow(() => createLeadFunnelTracker(FORM_NAMES.safetyVisit).leadCreated({ leadId: "zoho-id" }));
      assert.deepEqual(attempts, ["generate_lead", "conversion"]);
      assert.equal(fbqCalls.filter((call) => call[1] === "Lead").length, 1);
    });
  }
});

test("nothing is sent when no destination is configured", () => {
  withBrowser("https://www.masoncompany.in/", {}, (browser, gtagCalls, fbqCalls) => {
    createLeadFunnelTracker(FORM_NAMES.safetyVisit).leadCreated({ leadId: "1" });
    trackPageView(1000);
    assert.equal(gtagCalls.length, 0);
    assert.equal(fbqCalls.length, 0);
    assert.equal(browser.dataLayer, undefined);
  });
});

// ------------------------------------------------------------ destinations

test("Google Ads receives a lead conversion only when its id and label are configured", () => {
  withBrowser("https://www.masoncompany.in/", { ...GA, NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-1" }, (_browser, gtagCalls) => {
    createLeadFunnelTracker(FORM_NAMES.safetyVisit).leadCreated({ leadId: "L1" });
    assert.equal(events(gtagCalls, "conversion").length, 0);
  });

  withBrowser(
    "https://www.masoncompany.in/",
    { ...GA, NEXT_PUBLIC_GOOGLE_ADS_ID: "AW-1", NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL: "abc" },
    (_browser, gtagCalls) => {
      const funnel = createLeadFunnelTracker(FORM_NAMES.safetyVisit);
      funnel.submitAttempt();
      assert.equal(events(gtagCalls, "conversion").length, 0, "a submit attempt is not a conversion");
      funnel.leadCreated({ leadId: "L1" });
      assert.deepEqual(events(gtagCalls, "conversion"), [{ send_to: "AW-1/abc", transaction_id: "L1" }]);
    }
  );
});

test("Meta receives Lead for a created lead and only the spreadsheet's custom events", () => {
  withBrowser("https://www.masoncompany.in/", { NEXT_PUBLIC_META_PIXEL_ID: "123" }, (_browser, gtagCalls, fbqCalls) => {
    trackAnalyticsEvent("view_package", { package_name: "Standard", package_price: 30000 });
    trackAnalyticsEvent("view_service", { service_name: "Safety Assessment" });
    const funnel = createLeadFunnelTracker(FORM_NAMES.safetyVisit);
    funnel.start();
    funnel.submitAttempt();
    funnel.leadCreated({ leadId: "L1", packageName: "Standard" });

    assert.equal(gtagCalls.length, 0, "GA4 stays off without its measurement id");
    assert.deepEqual(fbqCalls[0], ["init", "123"]);
    const tracked = fbqCalls.slice(1).map((call) => `${call[0]}:${call[1]}`);
    assert.deepEqual(tracked, ["trackCustom:view_package", "trackCustom:form_start", "track:Lead"]);
    const lead = fbqCalls.find((call) => call[1] === "Lead");
    assert.deepEqual(lead?.[3], { eventID: "L1" });
    assert.equal((lead?.[2] as Record<string, unknown>).package_name, "Standard");
  });
});
