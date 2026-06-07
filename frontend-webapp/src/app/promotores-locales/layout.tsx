import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Promotores locales | Going App Ecuador',
  description: 'Gana siendo promotor local de Going App en tu ciudad.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
