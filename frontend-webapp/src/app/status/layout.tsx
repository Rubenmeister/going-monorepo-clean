import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estado del servicio | Going App Ecuador',
  description: 'Estado operativo en tiempo real de los servicios de Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
