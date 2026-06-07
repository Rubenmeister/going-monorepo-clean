import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Economía colaborativa | Going App',
  description: 'Cómo Going App impulsa la economía colaborativa y local en el Ecuador.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
