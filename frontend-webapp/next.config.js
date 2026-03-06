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
      '@': path.resolve(__dirname, './src/app'),
    };
    return config;
  },
};

module.exports = nextConfig;
