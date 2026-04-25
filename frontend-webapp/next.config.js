//@ts-check

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Aliases para los libs internos del monorepo. Estos son resueltos
      // explícitamente porque Next.js no los conoce vía tsconfig (los
      // libs son shims locales bajo src/lib/* que NO están en
      // node_modules — se importan desde apps Vercel-standalone).
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
      // NOTA: NO definir alias `@/*` aquí. Webpack alias no soporta
      // arrays, lo cual rompe los multi-paths de tsconfig.json
      // (`@/lib/*` y `@/components/*` viven en DOS directorios cada
      // uno: src/* y src/app/*). Next.js respeta tsconfig.json paths
      // automáticamente, que sí soportan arrays. Bug histórico:
      // un alias webpack `@: ./src/app` rompía /empresas porque los
      // módulos viven en ./src/lib/empresas, no ./src/app/lib/empresas.
    };
    return config;
  },
};

module.exports = nextConfig;
