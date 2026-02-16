import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/enterprise-portal',
  build: {
    reportCompressedSize: true,
    outDir: '../dist/enterprise-portal',
    emptyOutDir: true,
  },
  server: {
    port: 4300,
    host: 'localhost',
    fs: {
      allow: ['..'],
    },
  },
  preview: {
    port: 4400,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths()],
});
