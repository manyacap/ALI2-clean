// build-sw.mjs
import { generateSW } from 'workbox-build';

(async () => {
  const { count, size, warnings } = await generateSW({
    globDirectory: 'dist',
    globPatterns: ['**/*.{html,js,css,png,svg,json}'],
    globIgnores: ['styles/main.css'],
    swDest: 'dist/sw.js',
    clientsClaim: true,
    skipWaiting: true,
  });

  warnings.forEach(w => console.warn(w));
  console.log(`✔ Generated ${count} files, totaling ${size} bytes.`);
})();
