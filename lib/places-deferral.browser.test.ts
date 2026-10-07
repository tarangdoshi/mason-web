import assert from "node:assert/strict";
import test from "node:test";
import React from "react";

const { JSDOM } = require("jsdom");

/*
 * Google Maps / Places loads only when an address field is needed (visible, focused, tapped or typed
 * in), never just because a hidden booking form is mounted. Location capture must behave exactly as
 * before once it loads.
 */
type Observed = { callback: IntersectionObserverCallback; targets: Element[] };

type Harness = {
  window: Window & typeof globalThis & Record<string, unknown>;
  document: Document;
  scripts: () => HTMLScriptElement[];
  intersect: (visible: boolean) => Promise<void>;
  observers: Observed[];
  mount: (count?: number) => Promise<HTMLInputElement[]>;
  type: (input: HTMLInputElement, value: string) => Promise<void>;
  metas: unknown[];
  loadGoogle: () => Promise<{ autocompletes: HTMLInputElement[] }>;
};

async function withPlacesDom(
  options: { intersectionObserver?: boolean; googlePreloaded?: boolean },
  run: (harness: Harness) => Promise<void>
) {
  const dom = new JSDOM('<div id="root"></div>', { url: "https://www.masoncompany.in/" });
  const names = ["window", "self", "document", "navigator", "HTMLElement", "HTMLInputElement", "Element", "Event", "MutationObserver", "IntersectionObserver", "React", "IS_REACT_ACT_ENVIRONMENT"];
  const originals = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const previousKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "browser-test-key";

  const observers: Observed[] = [];
  class FakeIntersectionObserver {
    entry: Observed;
    constructor(callback: IntersectionObserverCallback) { this.entry = { callback, targets: [] }; observers.push(this.entry); }
    observe(target: Element) { this.entry.targets.push(target); }
    unobserve() {}
    disconnect() { this.entry.targets = []; }
    takeRecords() { return []; }
  }
  for (const name of names) {
    const value = name === "React" ? React
      : name === "IS_REACT_ACT_ENVIRONMENT" ? true
        : name === "IntersectionObserver" ? (options.intersectionObserver === false ? undefined : FakeIntersectionObserver)
          : name === "window" || name === "self" ? dom.window
            : name === "document" ? dom.window.document
              : dom.window[name];
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  if (options.intersectionObserver === false) delete (dom.window as Record<string, unknown>).IntersectionObserver;
  else (dom.window as Record<string, unknown>).IntersectionObserver = FakeIntersectionObserver;

  const autocompletes: HTMLInputElement[] = [];
  class Autocomplete {
    constructor(input: HTMLInputElement) { autocompletes.push(input); }
    addListener() { return { remove() {} }; }
    getPlace() { return {}; }
  }
  const fakeGoogle = { maps: { places: { Autocomplete }, event: { clearInstanceListeners() {} } } };
  if (options.googlePreloaded) (dom.window as Record<string, unknown>).google = fakeGoogle;

  const { createRoot } = require("react-dom/client");
  const LocationField = require("../components/LocationField.tsx").default;
  const root = createRoot(dom.window.document.getElementById("root"));
  const metas: unknown[] = [];
  const { act } = React;

  try {
    await run({
      window: dom.window,
      document: dom.window.document,
      scripts: () => Array.from(dom.window.document.querySelectorAll("script#aegis-google-maps")) as HTMLScriptElement[],
      observers,
      intersect: async (visible) => {
        await act(async () => {
          for (const observer of observers) {
            for (const target of observer.targets) {
              observer.callback([{ isIntersecting: visible, target } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
            }
          }
        });
      },
      mount: async (count = 1) => {
        await act(async () => root.render(React.createElement("div", null,
          ...Array.from({ length: count }, (_, index) => React.createElement(LocationField, { key: index, onMeta: (meta: unknown) => metas.push(meta) })))));
        return Array.from(dom.window.document.querySelectorAll("input")) as HTMLInputElement[];
      },
      type: async (input, value) => {
        await act(async () => {
          Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!.call(input, value);
          input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
        });
      },
      metas,
      loadGoogle: async () => {
        await act(async () => {
          (dom.window as Record<string, unknown>).google = fakeGoogle;
          (dom.window as unknown as { __aegisGooglePlacesReady__?: () => void }).__aegisGooglePlacesReady__?.();
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        return { autocompletes };
      }
    });
  } finally {
    await act(async () => root.unmount());
    dom.window.close();
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    else process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = previousKey;
  }
}

test("a mounted but hidden address field does not download Google Maps", async () => {
  await withPlacesDom({}, async ({ scripts, mount, intersect }) => {
    await mount();
    assert.equal(scripts().length, 0, "nothing loads while the booking form is hidden");
    await intersect(false);
    assert.equal(scripts().length, 0, "an off-screen report does not load it either");
    await intersect(true);
    assert.equal(scripts().length, 1, "it loads when the field comes into view (dialog opened)");
  });
});

test("focusing, tapping or typing in the field loads Places even before it is reported visible", async () => {
  for (const event of ["focus", "pointerdown", "keydown"]) {
    await withPlacesDom({}, async ({ window, scripts, mount }) => {
      const [input] = await mount();
      await React.act(async () => { input.dispatchEvent(new window.Event(event)); });
      assert.equal(scripts().length, 1, event);
    });
  }
});

test("several address fields and repeat triggers inject the script exactly once", async () => {
  await withPlacesDom({}, async ({ window, scripts, mount, intersect }) => {
    const inputs = await mount(2);
    await intersect(true);
    for (const input of inputs) {
      await React.act(async () => {
        input.dispatchEvent(new window.Event("focus"));
        input.dispatchEvent(new window.Event("focus"));
      });
    }
    assert.equal(scripts().length, 1);
  });
});

test("typing before Places arrives keeps the address, and autocomplete attaches when it lands", async () => {
  await withPlacesDom({}, async ({ window, scripts, mount, type, metas, loadGoogle }) => {
    const [input] = await mount();
    await React.act(async () => { input.dispatchEvent(new window.Event("focus")); });
    await type(input, "Miramar, Panaji");
    assert.equal(input.value, "Miramar, Panaji");
    const latest = metas.at(-1) as { formattedAddress?: string; serviceability?: { source?: string } };
    assert.equal(latest.formattedAddress, "Miramar, Panaji", "the manual address is recorded immediately");
    assert.equal(latest.serviceability?.source, "MANUAL_ENTRY");
    assert.equal(scripts().length, 1);
    const { autocompletes } = await loadGoogle();
    assert.deepEqual(autocompletes, [input], "Autocomplete attaches to the same input once Places is ready");
    assert.equal(input.value, "Miramar, Panaji", "what the visitor typed is untouched");
  });
});

test("when Places is already on the page, autocomplete attaches at once (no new script)", async () => {
  await withPlacesDom({ googlePreloaded: true }, async ({ scripts, mount, loadGoogle }) => {
    const [input] = await mount();
    const { autocompletes } = await loadGoogle();
    assert.deepEqual(autocompletes, [input]);
    assert.equal(scripts().length, 0);
  });
});

test("browsers without IntersectionObserver load Places on mount, as before", async () => {
  await withPlacesDom({ intersectionObserver: false }, async ({ scripts, mount }) => {
    await mount();
    assert.equal(scripts().length, 1);
  });
});
