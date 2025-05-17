const contentToCache = [
  "/index.js",
  "/service_worker.js",
  "/index.html",
  "/icon_512.png",
  "/icon_192.png",
  "/favicon.ico",
]
self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
  e.waitUntil(
    (async () => {
      const cache = await caches.open('cachename');
      console.log("[Service Worker] Caching all: app shell and content");
      await cache.addAll(contentToCache);
    })(),
  );
});