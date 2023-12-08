const version = 2;
const cacheName = `pwa_cache_${version}`;
const cacheList = [
  "./",
  "./index.html",
  "./main.css",
  "./404.html",
  "./404.png",
  "./main.js",
];

self.addEventListener("install", (ev) => {
  //load the cacheList array into the cache
  ev.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(cacheList);
    })
  );
});

self.addEventListener("activate", (ev) => {
  //delete old versions of the cache
  ev.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key != cacheName).map((nm) => caches.delete(nm))
      );
    })
  );
});

self.addEventListener("fetch", (ev) => {
  //handle fetch requests
  //online? external? font? css? img? html? specific folder?
  const isOnline = self.navigator.onLine;
  const url = new URL(ev.request.url);

  // if (isOnline) {
  //   ev.respondWith(networkRevalidateAndCache(ev));
  // } else {
  //   ev.respondWith(cacheOnly(ev));
  // }

  ev.respondWith(staleWhileRevalidate(ev));
});

async function cacheOnly(ev) {
  //only return what is in the cache
  return await caches.match(ev.request);
}

async function cacheFirst(ev) {
  try {
    const cacheResponse = await caches.match(ev.request);

    if (cacheResponse) {
      return cacheResponse;
    }

    const fetchResponse = await fetch(ev.request);
    return fetchResponse;
  } catch (error) {
    // Handle fetch or cache error
  }
}

async function networkOnly(ev) {
  //only return fetch response
  return await fetch(ev.request);
}

async function networkFirst(ev) {
  try {
    const fetchResponse = await fetch(ev.request);
    if (fetchResponse.ok) return fetchResponse;

    return await caches.match(ev.request);
  } catch (error) {
    return await caches.match(ev.request);
  }
}

async function staleWhileRevalidate(ev) {
  try {
    const cacheResponse = await caches.match(ev.request);
    const fetchResponse = await fetch(ev.request);
    if (fetchResponse.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(ev.request, fetchResponse.clone());
      return fetchResponse;
    } else {
      return cacheResponse || fetchResponse;
    }
  } catch (error) {
    // Handle fetch error
    return await caches.match(ev.request);
  }
}

self.addEventListener("fetch", async function (event) {
  try {
    const cache = await caches.open(cacheName);
    const cacheResponse = await cache.match(event.request);
    const networkResponse = await fetch(event.request);
    await cache.put(event.request, networkResponse.clone());
    return cacheResponse || networkResponse;
  } catch (error) {
    console.error("Failed to fetch", error);
  }
});
