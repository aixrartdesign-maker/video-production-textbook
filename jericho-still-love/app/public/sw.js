// Service worker: only so the game can be installed as an app and opened offline
// without a blank screen. Pages always come from the network; when there is no
// network, a small offline page is shown. Game files are not cached here, so a new
// deploy reaches visitors at once.
const CACHE = "offline-v2";
const OFFLINE = ["/offline", "/icons/icon-192.png"]; // the host serves offline.html at /offline

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.mode !== "navigate") {
    // only the offline page's own icon falls back to the cache; the rest goes straight to the network
    if (OFFLINE.includes(new URL(req.url).pathname)) e.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(fetch(req).catch(() => caches.match("/offline")));
});
