/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // El marketing site (goingec.com / www.goingec.com) NO sirve flujos de
  // auth — eso vive en frontend-webapp (app.goingec.com). Pero los emails
  // del backend pueden tener URLs legacy apuntando a goingec.com/auth/*
  // (cambiar FRONTEND_URL no rota los emails ya enviados). Redirect 307
  // (temporal, preserva el método HTTP y los query params como ?token=) para
  // que esas URLs históricas sigan funcionando sin sacrificar el SEO de la
  // landing.
  async redirects() {
    return [
      {
        source: '/auth/:path*',
        destination: 'https://app.goingec.com/auth/:path*',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
