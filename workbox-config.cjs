// workbox-config.cjs
// Configuración para injectManifest de Workbox
module.exports = {
  // Carpeta donde buscar los assets generados por build
  globDirectory: 'dist/',

  // Patrón de archivos a precachear
  globPatterns: [
    '**/*.{html,js,css,png,jpg,svg,woff2,json}'
  ],

  // Archivo fuente de tu Service Worker personalizado
  swSrc: 'sw.js',

  // Destino final para el Service Worker inyectado
  swDest: 'dist/sw.js'
};


