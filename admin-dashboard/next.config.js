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
      '@going-monorepo-clean/shared-ui': path.resolve(
        __dirname,
        './src/lib/shared-ui'
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
