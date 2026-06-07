import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seguridad | Going App Ecuador',
  description: 'Cómo Going App protege tus viajes, tus datos y tus pagos.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
