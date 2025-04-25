// build-sw.mjs
import { generateSW } from 'workbox-build';

async function buildServiceWorker() {
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
}

buildServiceWorker().catch(err => {
  console.error('Error generating SW:', err);
  process.exit(1);
});
