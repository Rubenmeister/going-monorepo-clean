//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // NOTA: NO definir alias webpack aquí (ni `@/*` ni nombres de libs).
    // Webpack alias no soporta arrays, lo cual rompe los multi-paths de
    // tsconfig.json (`@/lib/*` y `@/components/*` viven en DOS directorios
    // cada uno: src/* y src/app/*). Next.js respeta tsconfig.json paths
    // automáticamente, que sí soportan arrays. Bug histórico: un alias
    // webpack `@: ./src/app` rompía /empresas porque los módulos viven en
    // ./src/lib/empresas, no ./src/app/lib/empresas.
    return config;
  },
};

module.exports = nextConfig;
