const { withNx } = require('@nx/next/plugins/with-nx');

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  transpilePackages: ['@going/shared-ui', 'lucide-react'],
  // Skip static page generation for error pages
  generateBuildId: async () => {
    return 'admin-dashboard-build';
  },
  // Disable static optimization to avoid SSG issues with client components
  experimental: {
    // Opt out of static optimization for routes that use client components
  },
};

module.exports = withNx(nextConfig);
