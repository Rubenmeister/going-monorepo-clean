//@ts-check

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@going-monorepo-clean/frontend-providers': path.resolve(
        __dirname,
        './src/lib/providers'
      ),
      '@going-monorepo-clean/frontend-stores': path.resolve(
        __dirname,
        './src/lib/stores'
      ),
      '@going-monorepo-clean/shared-ui': path.resolve(
        __dirname,
        './src/lib/shared-ui'
      ),
      // tsconfig.json define `@/lib/*` con dos paths: ./src/lib/* y
      // ./src/app/lib/*. Webpack alias no soporta arrays, así que damos
      // prioridad explícita a src/lib (donde vive empresas/, etc.) para
      // que /empresas/page.tsx y compañía resuelvan en build de Vercel.
      // Bug detectado: sin este alias específico, `@/lib/empresas/constants`
      // resolvía a ./src/app/lib/empresas/constants (que no existe) y la
      // página /empresas no aparecía en el build de producción.
      '@/lib': path.resolve(__dirname, './src/lib'),
      // Resto de subpaths sí están en src/app/* — alias específicos para
      // evitar que el catch-all `@/*` los rompa.
      '@/components': path.resolve(__dirname, './src/app/components'),
      '@/services': path.resolve(__dirname, './src/app/services'),
      '@/hooks': path.resolve(__dirname, './src/app/hooks'),
      '@/utils': path.resolve(__dirname, './src/app/utils'),
      '@/types': path.resolve(__dirname, './src/app/types'),
      '@/stores': path.resolve(__dirname, './src/app/stores'),
      '@/contexts': path.resolve(__dirname, './src/app/contexts'),
      // Catch-all final
      '@': path.resolve(__dirname, './src/app'),
    };
    return config;
  },
};

module.exports = nextConfig;
