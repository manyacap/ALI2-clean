// workbox-config.js

module.exports = {
  // Directorio base de tu build (OUTPUT) de producción
  globDirectory: 'dist/',
  // Patrón de los archivos que sí quieres precachear
  globPatterns: [
    '**/*.{html,js,css,png,svg,json}'
  ],
  // Ignora específicamente los ficheros que no existen
  globIgnores: [
    'styles/main.css'
  ],
  // Ruta donde se generará el service worker
  swDest: 'dist/sw.js',
  // Para que el SW tome el control de las páginas inmediatamente
  clientsClaim: true,
  skipWaiting: true,
  // Puedes añadir caching en tiempo de ejecución si lo necesitas
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.tuservicio\.com\//,
      handler: 'NetworkFirst',
      options: {
        networkTimeoutSeconds: 10,
        cacheName: 'api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutos
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
};
