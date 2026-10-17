const CACHE_NAME = "chemora-shell-v3";
const PRECACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/v2-enhancements.css",
  "/modern-overhaul.css",
  "/reference-ui.css",
  "/app.js",
  "/voice-assistant.js",
  "/progress.html",
  "/progress.css",
  "/progress.js",
  "/challenge/challenge.html",
  "/challenge/challenge.css",
  "/know/know.html",
  "/experiments/experiments.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(PRECACHE.map(path => new Request(path, {cache:"reload"}))).catch(() => {})
  ).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith("chemora-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never cache account/authentication pages or API responses.
  if (url.pathname === "/account.html" || url.pathname.startsWith("/api/")) return;
  // Cache-first for challenge data and versioned static assets.
  if (/\.(?:css|js|png|svg|webp|woff2?|json)$/i.test(url.pathname)) {
    event.respondWith(caches.match(req).then(cached => {
      const network = fetch(req).then(response => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    }));
    return;
  }
  // Network-first for pages so updates appear when online; use cache offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(req);
      return cached || caches.match("/index.html") || Response.error();
    }));
  }
});
