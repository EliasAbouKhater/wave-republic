// Dreamland Menu service worker — Phase 1
// Minimal: makes the app installable. No offline yet.
// Strategy: network-only for HTML (always fresh menu), cache-first for static assets.

const CACHE = "dreamland-static-v1";
const STATIC_ASSETS = ["/manifest.json", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle same-origin
  if (url.origin !== self.location.origin) return;

  // Static assets under /_next/static or icons — cache-first
  if (url.pathname.startsWith("/_next/static") || STATIC_ASSETS.includes(url.pathname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit ?? fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })),
    );
    return;
  }
  // Everything else — network. Fallback to cache only if offline.
  e.respondWith(fetch(req).catch(() => caches.match(req) as Promise<Response>));
});
