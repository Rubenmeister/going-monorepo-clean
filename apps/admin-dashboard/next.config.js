/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*', // Proxy to API Gateway
      },
    ];
  },
  transpilePackages: ['@going/shared-ui', 'lucide-react'],
};

module.exports = nextConfig;
