import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eventos locales | Going App',
  description: 'Descubre eventos y actividades cerca de ti con Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
