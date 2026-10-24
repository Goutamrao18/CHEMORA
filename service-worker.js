const CACHE_NAME = "chemora-shell-v6";
const PRECACHE = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.png"
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
  // Never intercept or cache API, account pages, video media or range requests
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname === "/account.html" ||
    url.pathname.startsWith("/videos/") ||
    url.pathname.endsWith(".mp4") ||
    url.pathname.endsWith(".webm") ||
    req.headers.has("range")
  ) {
    return;
  }
  // Cache-first for challenge data and versioned static assets.
  if (/\.(?:css|js|png|svg|webp|woff2?|json)$/i.test(url.pathname)) {
    event.respondWith(caches.match(req).then(cached => {
      const network = fetch(req).then(response => {
        try {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
          }
        } catch (e) {}
        return response;
      }).catch(() => cached);
      return cached || network;
    }));
    return;
  }
  // Network-first for pages so updates appear when online; use cache offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).then(response => {
      try {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        }
      } catch (e) {}
      return response;
    }).catch(async () => {
      const cached = await caches.match(req);
      return cached || (await caches.match("/index.html")) || (await caches.match("/offline.html")) || Response.error();
    }));
  }
});
