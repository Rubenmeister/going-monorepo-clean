import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Festividades locales | Going App',
  description: 'Festividades y celebraciones del Ecuador con Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
