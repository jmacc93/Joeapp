self.addEventListener("install", (e) => {
  console.log("Service worker installing")
  e.waitUntil(
    (async () => {
      const cache = await caches.open('joeapp_cache')
      await cache.addAll([
        "./index.js",
        "./service_worker.js",
        "./index.html",
        "./icon_512.png",
        "./icon_192.png",
        "./favicon.ico",
      ])
    })(),
  )
})

self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const cacheMatches = await caches.match(e.request)
      if(cacheMatches)
        return cacheMatches
      const response = await fetch(e.request)
      const cache = await caches.open('joeapp_cache')
      cache.put(e.request, response.clone())
      return response
    })()
  )
})