const CACHE_NAME = 'alicia-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/ui/styles.css',
  '/assets/placeholder.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchResponse => {
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }

        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return fetchResponse;
      });
    }).catch(() => {
      if (event.request.url.match(/\.(jpg|jpeg|png|gif)$/)) {
        return caches.match('/assets/placeholder.png');
      }
      return caches.match('/index.html');
    })
  );
});
