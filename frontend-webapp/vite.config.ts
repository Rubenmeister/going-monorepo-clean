/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { join } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/frontend-webapp',

  // 1. MANTENEMOS LA CONFIGURACIÓN DE TAILWIND (¡Vital!)
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')({
          config: join(__dirname, 'tailwind.config.js'),
        }),
        require('autoprefixer'),
      ],
    },
  },

  server: {
    port: 4200,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  // 2. AGREGAMOS EL PLUGIN PWA
  plugins: [
    react(),
    nxViteTsPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true // Para que funcione en localhost
      },
      manifest: {
        name: 'Going App',
        short_name: 'Going',
        description: 'Tu viaje comienza aquí',
        theme_color: '#ff4c41', // El rojo de la marca
        background_color: '#ffffff',
        display: 'standalone', // Se verá como app nativa (sin barra de URL)
        orientation: 'portrait',
        icons: [
          {
            src: '/assets/icon-192.png', // Icono para pantalla de inicio
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/assets/icon-512.png', // Icono grande (Splash screen)
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],

  build: {
    outDir: '../dist/frontend-webapp',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});