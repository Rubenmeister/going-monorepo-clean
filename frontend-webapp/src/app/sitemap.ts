import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.goingec.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '', '/about', '/quienes-somos', '/careers', '/contact', '/help',
    '/security', '/status', '/sustainability', '/news', '/blog',
    '/destinations', '/tours', '/experiences', '/comunidad',
    '/comunidad-local/economia-colaborativa', '/comunidad-local/festividades',
    '/comunidad-local/eventos', '/comunidad-local/impacto',
    '/services', '/pasajeros', '/conductores', '/anfitriones',
    '/operadores', '/promotores-locales', '/empresas', '/ride', '/envios',
  ];
  const now = new Date();
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: r === '' ? 1 : 0.7,
  }));
}
