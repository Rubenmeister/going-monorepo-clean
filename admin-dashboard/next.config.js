//@ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sin alias webpack: los imports usan `@/lib/*` resuelto vía
  // tsconfig.json paths, que Next.js respeta automáticamente.
};

module.exports = nextConfig;
