importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

workbox.precaching.precacheAndRoute([
  { url: '/', revision: 'v8' },
  { url: '/styles/main.css', revision: '20230612' },
  { url: '/scripts/main.js', revision: 'v8' },
  { url: '/animations/loading.json', revision: 'v1' }
]);

workbox.routing.registerRoute(
  ({request}) => request.destination === 'image',
  new workbox.strategies.CacheFirst()
);

workbox.routing.registerRoute(
  /^https:\/\/.*\.supabase\.co\/.*$/,
  new workbox.strategies.NetworkFirst()
);
