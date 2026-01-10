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
  // Remoción de webpack alias manuales que causaban errores de resolución en Docker

};

module.exports = withNx(nextConfig);
