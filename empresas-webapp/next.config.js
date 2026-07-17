/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // NOTA: a diferencia de `website` (marketing, que redirige /auth/* a
  // app.goingec.com), ESTA app sirve sus propios flujos de auth corporativos
  // en /auth/* — NO redirigir.
};

module.exports = nextConfig;
