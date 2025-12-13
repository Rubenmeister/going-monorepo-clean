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
      host: true, // permite 0.0.0.0 cuando lo necesites
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
        manifest: {
          name: 'Going App',
          short_name: 'Going',
          description: 'Tu viaje comienza aquí',
          theme_color: '#ff4c41',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            { src: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/assets/icon-512.png', sizes: '512x512', type: 'image/png' },
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
