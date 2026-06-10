import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alojamiento | Going App Ecuador',
  description: 'Hospedaje y estadías en todo el Ecuador con Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
