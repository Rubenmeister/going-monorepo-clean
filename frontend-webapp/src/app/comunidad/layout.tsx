import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comunidad | Going App Ecuador',
  description: 'La comunidad Going App: viajeros, conductores, anfitriones y proveedores locales.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
