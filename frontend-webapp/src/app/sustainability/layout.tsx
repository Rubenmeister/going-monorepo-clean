import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sostenibilidad | Going App Ecuador',
  description: 'Nuestro compromiso ambiental: movilidad compartida y compensación de carbono.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
