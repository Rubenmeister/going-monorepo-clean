import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Envíos | Going App Ecuador',
  description: 'Envía sobres, documentos y paquetes puerta a puerta en Ecuador. Cotiza y rastrea tu envío desde la app.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
