// workbox-config.js

module.exports = {
  // Directorio donde está tu build de producción
  globDirectory: 'dist/',
  // Patrón de los archivos que sí quieres cachear
  globPatterns: [
    '**/*.{html,js,css,png,svg,json}'
  ],
  // Ignora específicamente el CSS que no existe en tu build
  globIgnores: [
    'styles/main.css'
  ],
  // Donde se generará el service worker
  swDest: 'dist/sw.js',
  // Opciones para que el SW tome control inmediatamente
  clientsClaim: true,
  skipWaiting: true,
  // Si hace falta, puedes añadir runtime caching aquí
  // runtimeCaching: [ ... ]
};

