import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

const { JSDOM } = require("jsdom");

test("checkout DB success shows the review screen without a Zoho lead conversion", async () => {
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
    await act(async () => root.render(React.createElement(CheckoutExperience, {
      entry, includedFeatures: [], excludedFeatures: [], addOnFeatures: []
    })));
    await act(async () => button("Enter area manually").click());
    await act(async () => setInput('input[placeholder="For example: Panaji, Goa"]', "Panaji, Goa"));
    await act(async () => button("Check serviceability").click());
    assert.match(dom.window.document.body.textContent || "", /Service available/);

    // Native validation blocks the empty form's submit event, but the click is
    // still a genuine attempt and must not post or produce a lead conversion.
    await act(async () => button("Review booking details").click());
    assert.equal(googleEvents("form_submit").length, 1);
    assert.equal(checkoutPosts, 0);

    await act(async () => setInput('input[name="name"]', "Asha Nair"));
    await act(async () => setInput('input[name="phone"]', "9876543210"));
    await act(async () => setInput('input[name="date"]', "2026-10-01"));
    await act(async () => setInput('input[name="addressLine1"]', "Building A"));
    assert.equal((dom.window.document.querySelector("form") as HTMLFormElement).checkValidity(), true);
    await act(async () => button("Review booking details").click());

    assert.equal(checkoutPosts, 1);
    assert.equal(googleEvents("form_submit").length, 2, "the valid retry adds one attempt");
    assert.equal(googleEvents("checkout_lead_submit_success").length, 1);
    assert.equal(googleEvents("generate_lead").length, 0);
    assert.equal(googleEvents("conversion").length, 0);
    assert.equal(metaCalls.filter((call) => call[1] === "Lead").length, 0);
    assert.match(dom.window.document.body.textContent || "", /Booking request received/);
    assert.match(dom.window.document.body.textContent || "", /Your Standard booking request has been sent to Mason Company/);
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
});
