//@ts-check

const path = require('path');

/**
 * @type {import('next').NextConfig}
 **/
const nextConfig = {
  // Next.js configuration
  turbopack: {
    root: path.join(__dirname, '..'),
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
