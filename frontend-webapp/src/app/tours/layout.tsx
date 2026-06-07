import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tours | Going App Ecuador',
  description: 'Reserva tours y experiencias guiadas por todo el Ecuador con Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
