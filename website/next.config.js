/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Biblioteca real de fotos de Going en Google Cloud Storage
      // (bucket público `going-content-media`). Next/Image las optimiza
      // (redimensiona + WebP + responsivo) al vuelo, igual que haría Cloudinary.
      { protocol: 'https', hostname: 'storage.googleapis.com' },
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
      // Las páginas de COMUNICACIÓN (noticias, revista, blog, academia) son
      // canónicas en la webapp (app.goingec.com), no en el sitio. El sitio solo
      // ENLAZA a ellas. Redirigimos las rutas viejas del sitio para que ningún
      // enlace guardado o indexado quede colgando. Permanent (308) para
      // consolidar el SEO en la webapp.
      { source: '/noticiero', destination: 'https://app.goingec.com/news', permanent: true },
      { source: '/noticias', destination: 'https://app.goingec.com/news', permanent: true },
      { source: '/revista', destination: 'https://app.goingec.com/revista', permanent: true },
      { source: '/blog', destination: 'https://app.goingec.com/blog', permanent: true },
      { source: '/academia', destination: 'https://app.goingec.com/academy', permanent: true },
    ];
  },
};

module.exports = nextConfig;
