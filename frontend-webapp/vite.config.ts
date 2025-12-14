/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { join } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const API_BASE = env.VITE_API_BASE_URL || 'http://localhost:3000';

  const isDev = mode === 'development';

  return {
    root: __dirname,
    cacheDir: '../node_modules/.vite/frontend-webapp',

    css: {
      postcss: {
        plugins: [
          require('tailwindcss')({ config: join(__dirname, 'tailwind.config.js') }),
          require('autoprefixer'),
        ],
      },
    },

    server: {
      port: 4200,
      host: true,
      proxy: isDev
        ? {
            '/api': {
              target: API_BASE,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },

    preview: {
      port: 4300,
      host: true,
    },

    plugins: [
      react(),
      nxViteTsPaths(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: { enabled: isDev },
        
        // Workbox configuration for offline support
        workbox: {
          // Cache static assets
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          
          // Runtime caching strategies
          runtimeCaching: [
            {
              // Cache API responses with network-first strategy
              urlPattern: /^https?:\/\/.*\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              // Cache images with cache-first strategy
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              // Cache Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        },
        
        manifest: {
          name: 'Going App',
          short_name: 'Going',
          description: 'Tu viaje comienza aquí',
          theme_color: '#ff4c41',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
      }),
    ],

    build: {
      outDir: '../dist/frontend-webapp',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: { transformMixedEsModules: true },
    },
  };
});
