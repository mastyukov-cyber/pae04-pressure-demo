// PAE-04 v0.2.0 TEST: same-origin static shell only. No clinical or user data in cache.
const CACHE_NAME = "pae04-medications-preview-MT-20261112.1";
const SHELL = ["./", "./index.html", "./styles.css", "./app.mjs", "./meds-model.mjs"];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => name.startsWith("pae04-medications-preview-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const scopePath = new URL(self.registration.scope).pathname;
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(scopePath)) return;
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(request).then((cached) => cached || fetch(request)))
  );
});
