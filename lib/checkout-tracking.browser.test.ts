import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

const { JSDOM } = require("jsdom");

type CheckoutHarness = {
  dom: { window: Window & typeof globalThis & Record<string, unknown> };
  render: () => Promise<void>;
  act: (callback: () => unknown) => Promise<void>;
  button: (label: string) => HTMLButtonElement;
  setInput: (selector: string, value: string) => void;
  googleEvents: (name: string) => unknown[][];
  metaCalls: unknown[][];
  checkoutPosts: () => number;
};

/** How the checkout lead endpoint answers. Defaults to the created-lead response. */
type CheckoutResponder = () => Promise<Response>;

async function withCheckout(run: (harness: CheckoutHarness) => Promise<void>, respond?: CheckoutResponder) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://www.masoncompany.in/checkout/package-standard" });
  const names = ["window", "document", "navigator", "HTMLElement", "HTMLAnchorElement", "Element", "FormData", "Event", "MouseEvent", "IntersectionObserver", "React", "IS_REACT_ACT_ENVIRONMENT"];
  const originals = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const previousFetch = globalThis.fetch;
  const previousCssLoader = require.extensions[".css"];
  const envKeys = ["NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_GOOGLE_ADS_ID", "NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL", "NEXT_PUBLIC_META_PIXEL_ID"];
  const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  for (const name of names) {
    const value = name === "React" ? React
      : name === "IS_REACT_ACT_ENVIRONMENT" ? true
        : name === "IntersectionObserver" ? class { observe() {} unobserve() {} disconnect() {} }
          : name === "window" ? dom.window
            : name === "document" ? dom.window.document
              : dom.window[name];
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  require.extensions[".css"] = (module: { exports: unknown }) => { module.exports = {}; };
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST";
  process.env.NEXT_PUBLIC_GOOGLE_ADS_ID = "AW-TEST";
  process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_LABEL = "lead";
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "123";

  const googleCalls: unknown[][] = [];
  const metaCalls: unknown[][] = [];
  dom.window.gtag = (...args: unknown[]) => void googleCalls.push(args);
  dom.window.fbq = (...args: unknown[]) => void metaCalls.push(args);
  let checkoutPosts = 0;
  globalThis.fetch = (async (url: string) => {
    assert.equal(url, "/api/leads/checkout");
    checkoutPosts += 1;
    if (respond) return respond();
    return new Response(JSON.stringify({ data: { id: "mason-db-uuid" } }), { status: 201, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  const { createRoot } = require("react-dom/client");
  const { getPackageCatalogEntry } = require("../content/package-catalog.ts");
  const CheckoutExperience = require("../app/(marketing)/checkout/components/checkout-experience.tsx").default;
  const root = createRoot(dom.window.document.getElementById("root"));
  const { act } = React;
  const button = (label: string): HTMLButtonElement => {
    const buttons = dom.window.document.querySelectorAll("button") as NodeListOf<HTMLButtonElement>;
    const found = Array.from(buttons).find((item) => item.textContent === label);
    assert.ok(found, `button ${label} exists`);
    return found as HTMLButtonElement;
  };
  const setInput = (selector: string, value: string) => {
    const input = dom.window.document.querySelector(selector) as HTMLInputElement;
    assert.ok(input, `input ${selector} exists`);
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  };
  const googleEvents = (name: string) => googleCalls.filter((call) => call[0] === "event" && call[1] === name);

  try {
    const entry = getPackageCatalogEntry("package-standard");
    assert.ok(entry);
    const render = () => act(async () => root.render(React.createElement(CheckoutExperience, {
      entry, includedFeatures: [], excludedFeatures: [], addOnFeatures: []
    })));
    await run({ dom, render, act, button, setInput, googleEvents, metaCalls, checkoutPosts: () => checkoutPosts });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    globalThis.fetch = previousFetch;
    if (previousCssLoader) require.extensions[".css"] = previousCssLoader;
    else delete require.extensions[".css"];
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }
}

test("checkout DB success shows the review screen without a Zoho lead conversion", async () => {
  await withCheckout(async ({ dom, render, act, button, setInput, googleEvents, metaCalls, checkoutPosts }) => {
      await render();
      await act(async () => button("Enter area manually").click());
      await act(async () => setInput('input[placeholder="For example: Panaji, Goa"]', "Panaji, Goa"));
      await act(async () => button("Check serviceability").click());
      assert.match(dom.window.document.body.textContent || "", /Service available/);

      // Native validation blocks the empty form's submit event, but the click is
      // still a genuine attempt and must not post or produce a lead conversion.
      await act(async () => button("Review booking details").click());
      assert.equal(googleEvents("form_submit").length, 1);
      assert.equal(checkoutPosts(), 0);

      await act(async () => setInput('input[name="name"]', "Asha Nair"));
      await act(async () => setInput('input[name="phone"]', "9876543210"));
      await act(async () => setInput('input[name="date"]', "2026-10-01"));
      await act(async () => setInput('input[name="addressLine1"]', "Building A"));
      assert.equal((dom.window.document.querySelector("form") as HTMLFormElement).checkValidity(), true);
      await act(async () => button("Review booking details").click());

      assert.equal(checkoutPosts(), 1);
      assert.equal(googleEvents("form_submit").length, 2, "the valid retry adds one attempt");
      assert.equal(googleEvents("checkout_lead_submit_success").length, 1);
      assert.equal(googleEvents("generate_lead").length, 0);
      assert.equal(googleEvents("conversion").length, 0);
      assert.equal(metaCalls.filter((call) => call[1] === "Lead").length, 0);
      assert.match(dom.window.document.body.textContent || "", /Booking request received/);
      assert.match(dom.window.document.body.textContent || "", /Your Standard booking request has been sent to Mason Company/);
  });
});

test("checkout is Goa only: a Mumbai or Bengaluru area is not offered a booking", async () => {
  for (const area of ["Andheri West, Mumbai", "Thane West", "Navi Mumbai", "Indiranagar, Bengaluru"]) {
    await withCheckout(async ({ dom, render, act, button, setInput, checkoutPosts }) => {
      await render();
      await act(async () => button("Enter area manually").click());
      await act(async () => setInput('input[placeholder="For example: Panaji, Goa"]', area));
      await act(async () => button("Check serviceability").click());
      const text = dom.window.document.body.textContent || "";
      assert.match(text, /Service currently not available in your area/, area);
      assert.doesNotMatch(text, /Service available in/, area);
      assert.doesNotMatch(text, /Mumbai Metro/, area);
      assert.equal(dom.window.document.querySelector('input[name="name"]'), null, `${area}: booking details stay locked`);
      assert.equal(checkoutPosts(), 0, `${area}: no booking request is sent`);
    });
  }
});

/* ---------------------------------------------------------------------------
   Refused checkout submissions.

   A booking request that the API rejects used to leave no trace at all: the
   customer saw an error, GA4 saw a form_submit and then silence, and that is
   indistinguishable from someone who simply walked away. These pin the failure
   signal, including that it never counts as a conversion. */

async function fillValidCheckout({ render, act, button, setInput }: CheckoutHarness) {
  await render();
  await act(async () => button("Enter area manually").click());
  await act(async () => setInput("input[placeholder=\"For example: Panaji, Goa\"]", "Panaji, Goa"));
  await act(async () => button("Check serviceability").click());
  await act(async () => setInput("input[name=\"name\"]", "Asha Nair"));
  await act(async () => setInput("input[name=\"phone\"]", "9876543210"));
  await act(async () => setInput("input[name=\"date\"]", "2026-10-01"));
  await act(async () => setInput("input[name=\"addressLine1\"]", "Building A"));
  await act(async () => button("Review booking details").click());
}

test("a refused checkout booking reports its failure category", async () => {
  const cases = [
    { status: 400, category: "validation" },
    { status: 500, category: "server" }
  ];
  for (const { status, category } of cases) {
    await withCheckout(
      async (harness) => {
        await fillValidCheckout(harness);

        const [failure] = harness.googleEvents("form_error");
        assert.ok(failure, `a ${status} reports form_error`);
        assert.equal((failure[2] as Record<string, unknown>).error_category, category);
        assert.equal((failure[2] as Record<string, unknown>).form_name, "Checkout Booking Form");
        assert.equal(harness.googleEvents("checkout_lead_submit_success").length, 0, "a refusal is not a success");
        // The customer still sees the API's own message — the failure signal is additive.
        assert.match(harness.dom.window.document.body.textContent || "", /Refused\./);
      },
      async () => new Response(JSON.stringify({ error: "Refused." }), { status, headers: { "Content-Type": "application/json" } })
    );
  }
});

test("a checkout booking that never reached Mason is reported as a network failure", async () => {
  await withCheckout(
    async (harness) => {
      await fillValidCheckout(harness);

      const [failure] = harness.googleEvents("form_error");
      assert.ok(failure, "a thrown request still reports form_error");
      assert.equal((failure[2] as Record<string, unknown>).error_category, "network");
    },
    async () => { throw new TypeError("Failed to fetch"); }
  );
});

test("a refused checkout booking is never an advertising conversion", async () => {
  await withCheckout(
    async (harness) => {
      await fillValidCheckout(harness);

      assert.equal(harness.googleEvents("form_error").length, 1);
      assert.equal(harness.googleEvents("conversion").length, 0, "a failure must not report a Google Ads conversion");
      assert.equal(harness.googleEvents("generate_lead").length, 0);
      assert.equal(harness.metaCalls.filter((call) => call[1] === "Lead").length, 0, "a failure must not reach Meta");
    },
    async () => new Response(JSON.stringify({ error: "Refused." }), { status: 500, headers: { "Content-Type": "application/json" } })
  );
});
