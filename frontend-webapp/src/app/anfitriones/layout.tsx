import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sé anfitrión | Going App Ecuador',
  description: 'Hospeda viajeros y genera ingresos como anfitrión local con Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
