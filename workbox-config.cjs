// workbox-config.cjs
/**
 * Configuración de Workbox para `generateSW`
 * Usamos CommonJS (module.exports) porque tu package.json está en type: "module"
 */
module.exports = {
    // Ruta donde Workbox mirará los ficheros preconstruidos
    globDirectory: 'dist/',
    // Patrones de los ficheros a cachear
    globPatterns: [
      '**/*.{html,js,css,png,jpg,svg,woff2,json}'
    ],
    // Dónde volcará el service worker generado
    swDest: 'dist/sw.js',
    // Hacer que el SW tome el control inmediatamente
    clientsClaim: true,
    skipWaiting: true,
    // Para que en modo SPA siempre sirva index.html cuando no encuentre ruta
    navigateFallback: 'index.html',
    // (Opcional) Caching runtime, ejemplo para imágenes y API:
    runtimeCaching: [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
          },
        },
      },
      {
        urlPattern: /^https:\/\/tu-api\.dominio\/.*$/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 5 * 60, // 5 minutos
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  };
  