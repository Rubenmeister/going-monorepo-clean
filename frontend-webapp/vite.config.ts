/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { join } from 'path';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/frontend-webapp',

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
  },
  
  // Plugins vitales para que Nx y React se hablen
  plugins: [react(), nxViteTsPaths()],

  build: {
    outDir: '../dist/frontend-webapp',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
  },
});