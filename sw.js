// sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precaché inyectado por Workbox durante build
precacheAndRoute(self.__WB_MANIFEST);

// Tomar control inmediatamente tras la activación
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  self.skipWaiting();
});

// Fallback para SPA: todas las navegaciones sirven index.html
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'html-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) =>
          response && response.type === 'basic' ? response : caches.match('/index.html')
      }
    ]
  })
);

// Caché de imágenes y fuentes estáticas
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|woff2)$/, 
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      {
        expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }
      }
    ]
  })
);

// Caché de la API de Supabase (NetworkFirst)
registerRoute(
  /^https:\/\/[^/]+\.supabase\.co\/.*$/,
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 10,
    plugins: [
      { expiration: { maxEntries: 30, maxAgeSeconds: 5 * 60 } },
      { cacheableResponse: { statuses: [0, 200] } }
    ]
  })
);

