const { withNx } = require('@nx/next/plugins/with-nx');

/** @type {import('@nx/next/plugins/with-nx').WithNxOptions} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  transpilePackages: ['@going/shared-ui', 'lucide-react'],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
      'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
      react: require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
      'react-dom/client': require.resolve('react-dom/client'),
      'react-dom/server': require.resolve('react-dom/server'),
    };
    return config;
  },
};

module.exports = withNx(nextConfig);
