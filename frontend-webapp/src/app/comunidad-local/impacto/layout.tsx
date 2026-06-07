import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impacto y sostenibilidad | Going App',
  description: 'El impacto social, económico y ambiental de Going App en las comunidades.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
