// workbox-config.cjs
module.exports = {
  globDirectory: 'dist',
  globPatterns: [
    '**/*.{js,css,html,png,svg,woff2}'
  ],
  swDest: 'dist/sw.js',
  // ✏️ Esta línea es la clave:
  navigateFallback: 'index.html',
};
