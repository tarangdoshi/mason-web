import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

const { JSDOM } = require("jsdom");

async function withAssessmentDom(run: (context: {
  document: Document;
  window: Window & typeof globalThis;
  form: HTMLFormElement;
  input: HTMLInputElement;
  setInput: (selector: string, value: string) => void;
  posts: Array<Record<string, unknown>>;
  autocomplete: () => { listener: () => void } | undefined;
  resolveGeocode: (result: unknown) => void;
  failGeocode: () => void;
}) => Promise<void>, response: () => Response = () => new Response(
  JSON.stringify({ data: { id: "zoho-test", locationMarket: "GOA" } }),
  { status: 201, headers: { "Content-Type": "application/json" } }
)) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://www.masoncompany.in/" });
  const names = ["window", "self", "document", "navigator", "HTMLElement", "HTMLInputElement", "Element", "FormData", "Event", "MouseEvent", "MutationObserver", "React", "IS_REACT_ACT_ENVIRONMENT"];
  const originals = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const previousFetch = globalThis.fetch;
  const previousCssLoader = require.extensions[".css"];
  const previousKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  for (const name of names) {
    const value = name === "React" ? React : name === "IS_REACT_ACT_ENVIRONMENT" ? true
      : name === "window" || name === "self" ? dom.window : name === "document" ? dom.window.document : dom.window[name];
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  require.extensions[".css"] = (module: { exports: unknown }) => { module.exports = {}; };
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "browser-test-key";
  const posts: Array<Record<string, unknown>> = [];
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    posts.push(JSON.parse(String(init.body)));
    return response();
  }) as typeof fetch;

  let autocompleteInstance: { listener: () => void } | undefined;
  let geocodeCallback: ((results: unknown[], status: string) => void) | undefined;
  class Autocomplete {
    listener = () => {};
    constructor(_input: HTMLInputElement, _options: unknown) { autocompleteInstance = this; }
    addListener(_event: string, listener: () => void) { this.listener = listener; return { remove() {} }; }
    getPlace() { return { formatted_address: "Miramar, Panaji, Goa", place_id: "selected-place", address_components: [] }; }
  }
  class Geocoder {
    geocode(_request: unknown, callback: (results: unknown[], status: string) => void) { geocodeCallback = callback; }
  }
  dom.window.google = { maps: { places: { Autocomplete }, Geocoder, event: { clearInstanceListeners() {} } } };

  const { createRoot } = require("react-dom/client");
  const AssessmentLeadForm = require("../app/components/assessment-lead-form.tsx").default;
  const root = createRoot(dom.window.document.getElementById("root"));
  const { act } = React;
  const setInput = (selector: string, value: string) => {
    const input = dom.window.document.querySelector(selector) as HTMLInputElement;
    assert.ok(input, selector);
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  };

  try {
    await act(async () => root.render(React.createElement(AssessmentLeadForm)));
    await act(async () => {
      setInput('input[name="customerName"]', "Asha Nair");
      setInput('input[name="phone"]', "9876543210");
      setInput('input[name="email"]', "asha@example.com");
      setInput('input[name="locationText"]', "Miramar");
    });
    await run({
      document: dom.window.document, window: dom.window,
      form: dom.window.document.querySelector("form") as HTMLFormElement,
      input: dom.window.document.querySelector('input[name="locationText"]') as HTMLInputElement,
      setInput, posts,
      autocomplete: () => autocompleteInstance,
      resolveGeocode: (result) => { assert.ok(geocodeCallback); geocodeCallback([result], "OK"); },
      failGeocode: () => { assert.ok(geocodeCallback); geocodeCallback([], "ZERO_RESULTS"); }
    });
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
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    else process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = previousKey;
  }
}

test("Goa installation wording appears only after a successful assessment and the form resets", async () => {
  await withAssessmentDom(async ({ window, form, posts }) => {
    assert.doesNotMatch(form.textContent ?? "", /Mason is currently available in Goa|Mason currently provides installations in Goa/);
    assert.equal(form.querySelector('[role="status"]'), null);

    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 1);
    const status = form.querySelector('[role="status"]');
    assert.ok(status);
    assert.match(status.textContent ?? "", /We’ve received your bathroom safety assessment request/);
    assert.match(status.textContent ?? "", /Our team will get in touch with you shortly/);
    assert.match(status.textContent ?? "", /Mason currently provides installations in Goa/);
    assert.match(status.textContent ?? "", /If you’re outside Goa, we’ll still keep your request with us as we expand to more locations/);
    for (const name of ["customerName", "phone", "email", "locationText"]) {
      assert.equal((form.elements.namedItem(name) as HTMLInputElement).value, "", `${name} resets after success`);
    }
  });
});

test("failed assessment keeps entered values and never shows the geography acknowledgement", async () => {
  await withAssessmentDom(async ({ window, form, posts }) => {
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 1);
    assert.equal(form.querySelector('[role="status"]'), null);
    assert.doesNotMatch(form.textContent ?? "", /Mason currently provides installations in Goa|If you’re outside Goa/);
    assert.equal((form.elements.namedItem("customerName") as HTMLInputElement).value, "Asha Nair");
    assert.equal((form.elements.namedItem("locationText") as HTMLInputElement).value, "Miramar");
    assert.match(form.querySelector('[role="alert"]')?.textContent ?? "", /Unable to submit your request/);
  }, () => new Response(JSON.stringify({ error: "Unable to submit your request." }), {
    status: 502, headers: { "Content-Type": "application/json" }
  }));
});

test("Enter reaches Google's input listener before form submit is prevented", async () => {
  await withAssessmentDom(async ({ document, window, form, input, posts, autocomplete, resolveGeocode }) => {
    const pac = document.createElement("div");
    pac.className = "pac-container";
    pac.innerHTML = '<div class="pac-item">Miramar, Panaji</div>';
    document.body.appendChild(pac);
    input.focus();
    let googleSawEnter = false;
    // Google's native input listener runs at the target; React's bubbling
    // handler must not cancel Enter before this listener can select a Place.
    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      googleSawEnter = true;
      assert.equal(event.defaultPrevented, false);
      autocomplete()?.listener();
    });
    const enter = new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    await React.act(async () => input.dispatchEvent(enter));
    assert.equal(googleSawEnter, true);
    assert.equal(enter.defaultPrevented, true);
    assert.equal(posts.length, 0);

    assert.ok(autocomplete());
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 0, "submission waits while Google is resolving");

    await React.act(async () => {
      resolveGeocode({
        formatted_address: "A-1, Miramar, Panaji, Goa 403001, India",
        place_id: "selected-place",
        address_components: [
          { long_name: "India", short_name: "IN", types: ["country"] },
          { long_name: "Goa", short_name: "Goa", types: ["administrative_area_level_1"] },
          { long_name: "Panaji", short_name: "Panaji", types: ["locality"] },
          { long_name: "Miramar", short_name: "Miramar", types: ["sublocality_level_1"] }
        ], geometry: { location: { lat: () => 15.49, lng: () => 73.82 } }
      });
      await Promise.resolve();
    });
    assert.equal(posts.length, 1);
    assert.equal(posts[0].locationText, "A-1, Miramar, Panaji, Goa 403001, India");
    const metadata = posts[0].metadata as Record<string, unknown>;
    assert.equal(metadata.locationMarket, "GOA");
    assert.equal((metadata.location as { placeId: string }).placeId, "selected-place");
    assert.ok(metadata.attribution, "attribution remains in the payload");
  });
});

test("click selection resolves through Google before submitting", async () => {
  await withAssessmentDom(async ({ document, window, form, posts, autocomplete, resolveGeocode }) => {
    const item = document.createElement("div");
    item.className = "pac-item";
    item.addEventListener("click", () => autocomplete()?.listener());
    document.body.appendChild(item);
    await React.act(async () => item.dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 0);
    await React.act(async () => {
      resolveGeocode({ formatted_address: "Miramar, Panaji, Goa", address_components: [
        { long_name: "India", short_name: "IN", types: ["country"] },
        { long_name: "Goa", short_name: "Goa", types: ["administrative_area_level_1"] },
        { long_name: "Panaji", short_name: "Panaji", types: ["locality"] }
      ] });
      await Promise.resolve();
    });
    assert.equal(posts.length, 1);
    assert.equal((posts[0].metadata as { locationMarket: string }).locationMarket, "GOA");
  });
});

test("a missing Google geocoder callback cannot block the lead and late data is ignored", async () => {
  await withAssessmentDom(async ({ window, form, input, posts, autocomplete, resolveGeocode }) => {
    await React.act(async () => { autocomplete()!.listener(); await Promise.resolve(); });
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 0);
    await React.act(async () => new Promise((resolve) => setTimeout(resolve, 3200)));
    assert.equal(posts.length, 1, "the external callback's failure boundary releases submission");
    assert.equal(posts[0].locationText, "Miramar");
    const metadata = posts[0].metadata as { locationMarket: string; location: { source: string }; serviceability: { locality: string | null; country: string | null; placeId: string | null } };
    assert.equal(metadata.locationMarket, "UNKNOWN");
    assert.equal(metadata.location.source, "manual");
    assert.equal(metadata.serviceability.locality, null);
    assert.equal(metadata.serviceability.country, null);
    assert.equal(metadata.serviceability.placeId, null);
    await React.act(async () => {
      resolveGeocode({ formatted_address: "Stale Goa result", address_components: [] });
      await Promise.resolve();
    });
    assert.notEqual(input.value, "Stale Goa result");
    assert.equal(posts.length, 1);
  });
});

test("manual edits during Google resolution invalidate the old Place", async () => {
  await withAssessmentDom(async ({ window, form, setInput, posts, autocomplete, resolveGeocode }) => {
    await React.act(async () => { autocomplete()!.listener(); await Promise.resolve(); });
    await React.act(async () => setInput('input[name="locationText"]', "Caranzalem, Panaji"));
    await React.act(async () => {
      resolveGeocode({ formatted_address: "Stale Miramar, Goa", address_components: [
        { long_name: "India", short_name: "IN", types: ["country"] },
        { long_name: "Goa", short_name: "Goa", types: ["administrative_area_level_1"] }
      ] });
      await Promise.resolve();
    });
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 1);
    assert.equal(posts[0].locationText, "Caranzalem, Panaji");
    assert.equal((posts[0].metadata as { locationMarket: string }).locationMarket, "UNKNOWN");
  });
});

test("the location field remains editable after a geocoder timeout", async () => {
  await withAssessmentDom(async ({ window, form, setInput, posts, autocomplete }) => {
    await React.act(async () => { autocomplete()!.listener(); await Promise.resolve(); });
    await React.act(async () => new Promise((resolve) => setTimeout(resolve, 3200)));
    await React.act(async () => setInput('input[name="locationText"]', "Caranzalem, Panaji"));
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 1);
    assert.equal(posts[0].locationText, "Caranzalem, Panaji");
    assert.equal((posts[0].metadata as { locationMarket: string }).locationMarket, "UNKNOWN");
  });
});

test("Google error permits later manual interaction and submission", async () => {
  await withAssessmentDom(async ({ window, form, setInput, posts, autocomplete, failGeocode }) => {
    await React.act(async () => { autocomplete()!.listener(); await Promise.resolve(); });
    await React.act(async () => { failGeocode(); await Promise.resolve(); });
    await React.act(async () => setInput('input[name="locationText"]', "Bodakdev, Ahmedabad"));
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 1);
    assert.equal(posts[0].locationText, "Bodakdev, Ahmedabad");
    assert.equal((posts[0].metadata as { locationMarket: string }).locationMarket, "UNKNOWN");
  });
});

test("Enter without a suggestion leaves normal manual keyboard submission available", async () => {
  await withAssessmentDom(async ({ window, form, input, posts }) => {
    const enter = new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    await React.act(async () => input.dispatchEvent(enter));
    assert.equal(enter.defaultPrevented, false);
    await React.act(async () => form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true })));
    assert.equal(posts.length, 1);
    assert.equal(posts[0].locationText, "Miramar");
    assert.equal((posts[0].metadata as { locationMarket: string }).locationMarket, "UNKNOWN");
  });
});
