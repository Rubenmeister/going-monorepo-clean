//@ts-check

const path = require('path');

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  // Compatibilidad con Next.js 15 (webpack) y 16+ (Turbopack por defecto)
  turbopack: {
    resolveAlias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
};

module.exports = nextConfig;
