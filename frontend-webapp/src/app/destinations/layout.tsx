import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Destinos del Ecuador | Going App',
  description: 'Descubre los mejores destinos del Ecuador para tu próximo viaje con Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
