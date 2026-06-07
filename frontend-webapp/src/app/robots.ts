import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.goingec.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/account', '/empresas/panel/', '/auth/', '/payment/', '/api/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
