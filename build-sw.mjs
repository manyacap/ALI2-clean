// build-sw.mjs
import { generateSW } from 'workbox-build';

(async () => {
  try {
    const { count, size, warnings } = await generateSW({
      globDirectory: 'dist',
      globPatterns: ['**/*.{html,js,css,png,svg,json}'],
      globIgnores: ['sw.js'],      // No vuelvas a cachear tu propio SW
      swDest: 'dist/sw.js',
      clientsClaim: true,
      skipWaiting: true,
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
      ],
    });

    if (warnings.length) {
      console.warn('⚠️ SW warnings:');
      warnings.forEach(w => console.warn(w));
    }

    // Aquí usamos backticks para interpolar y mantener el emoji
    console.log(`✅ ${count} files precached, ${(size / 1024).toFixed(2)} KB.`);
  } catch (err) {
    console.error('❌ Error generating SW:', err);
    process.exit(1);
  }
})();


