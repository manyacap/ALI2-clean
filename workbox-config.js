// workbox-config.js
module.exports = {
  // Carpeta donde Vite deja los ficheros compilados
  globDirectory: 'dist/',
  // Qué tipos de ficheros queremos cachear
  globPatterns: [
    '**/*.{js,css,html,png,svg,json}'
  ],
  // Dónde se genera el service worker
  swDest: 'dist/service-worker.js',
  // Opciones extra para que el SW active nuevo cliente y omita espera
  clientsClaim: true,
  skipWaiting: true,
  // Caché en tiempo real: ejemplo para imágenes y scripts
  runtimeCaching: [
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    }
  ],
};
