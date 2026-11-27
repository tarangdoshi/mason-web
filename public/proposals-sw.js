/* Mason Proposals service worker. Registered twice from flag-gated pages only: scope /crm/proposals/ (the staff
   Proposal Builder, installable) and scope /p/ (the customer page). Nothing else on the site is controlled.

   Caches (all named "mason-proposals-*", all deleted on logout):
   - shell: the builder page and the immutable Next.js build files it loads (/_next/static), icons, manifest.
   - data:  GET /crm/proposals/offline-bundle (proposal copy, component library, last good price list; no
            customer data) and the component photos.
   - open:  the one customer page last opened (/p/<token>); replaced by the next, never more than one. A copy
            stays readable offline on that phone after its link is revoked, until the next /p/ page replaces it.
   Customer drafts and queued work live in IndexedDB (lib/proposals/offline/idb.ts), not here. */

const VERSION = "v1";
const SHELL = `mason-proposals-shell-${VERSION}`;
const DATA = `mason-proposals-data-${VERSION}`;
const OPEN = `mason-proposals-open-${VERSION}`;
const OURS = [SHELL, DATA, OPEN];
const BUILDER = "/crm/proposals/new";
const BUNDLE = "/crm/proposals/offline-bundle";
const PRECACHE = ["/proposals.webmanifest", "/proposals-icon-192.png", "/proposals-icon-512.png"];
const MAX_PHOTOS = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)).catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith("mason-proposals-") && !OURS.includes(name)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

// Logout: delete every cache and stop storing anything for the rest of this worker's life (the page is about to
// leave; the registration is removed too, and the next sign-in registers a fresh worker).
let cleared = false;
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "clear") {
    cleared = true;
    event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("mason-proposals-")).map((name) => caches.delete(name)))));
  }
});

const usable = (response) => response && response.ok && !response.redirected && response.type !== "opaqueredirect";

async function networkFirst(request, cacheName, key) {
  try {
    const response = await fetch(request);
    if (usable(response)) {
      const cache = await caches.open(cacheName);
      await cache.put(key || request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(key || request, { cacheName });
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName, limit) {
  // ignoreVary: a photo fetched by precachePhotos (Accept */*) must still match the page's <img> request offline.
  const cached = await caches.match(request, { cacheName, ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  // Opaque (no-cors) responses are never stored: a later CORS fetch of the same photo (the PDF) would fail on them.
  if (usable(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    if (limit) {
      const keys = await cache.keys();
      const photos = keys.filter((key) => !key.url.endsWith(BUNDLE));
      for (const old of photos.slice(0, Math.max(0, photos.length - limit))) await cache.delete(old);
    }
  }
  return response;
}

const offlinePage = () => new Response(
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Offline</title>' +
  '<body style="font-family:system-ui;padding:24px;background:#FCF9F4;color:#2b211c"><h1>No signal</h1><p>Open this page again once you are online.</p></body>',
  { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || cleared) return;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  // Immutable build output (hashed file names): cache first.
  if (sameOrigin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, SHELL));
    return;
  }
  if (sameOrigin && PRECACHE.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, SHELL));
    return;
  }
  if (sameOrigin && url.pathname === BUNDLE) {
    event.respondWith(networkFirst(request, DATA, BUNDLE));
    return;
  }
  // Component photos (Sanity CDN, or a same-origin stand-in in tests).
  if (request.destination === "image" || url.hostname === "cdn.sanity.io") {
    if (url.hostname === "cdn.sanity.io" || (sameOrigin && !url.pathname.startsWith("/_next/image"))) {
      event.respondWith(cacheFirst(request, DATA, MAX_PHOTOS).catch(() => fetch(request)));
    }
    return;
  }
  if (request.mode !== "navigate" || !sameOrigin) return;

  // The builder: network first; offline, the last copy. Stored without the query string (?zohoLeadId=…), which
  // the page reads again in the browser.
  if (url.pathname === BUILDER) {
    if (!url.search) {
      event.respondWith(networkFirst(request, SHELL, BUILDER).catch(offlinePage));
      return;
    }
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        // Refresh the plain copy in the background, so the cached page never carries a lead id.
        if (usable(response)) event.waitUntil(fetch(BUILDER, { credentials: "same-origin" }).then((plain) => (usable(plain) ? caches.open(SHELL).then((cache) => cache.put(BUILDER, plain)) : undefined)).catch(() => undefined));
        return response;
      } catch {
        return (await caches.match(BUILDER, { cacheName: SHELL })) || offlinePage();
      }
    })());
    return;
  }
  // The customer page: keep only the most recent one.
  if (url.pathname.startsWith("/p/")) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (usable(response)) {
          await caches.delete(OPEN);
          const cache = await caches.open(OPEN);
          await cache.put(url.pathname, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(url.pathname, { cacheName: OPEN })) || offlinePage();
      }
    })());
  }
});
