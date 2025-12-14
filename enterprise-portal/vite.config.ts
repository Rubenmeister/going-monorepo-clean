import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/enterprise-portal',

  server: {
    port: 4300,
    host: true,
  },

  plugins: [react(), nxViteTsPaths()],

  build: {
    outDir: '../dist/enterprise-portal',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
});
