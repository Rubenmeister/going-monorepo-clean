import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Experiencias locales | Going App Ecuador',
  description: 'Vive experiencias auténticas con anfitriones locales en todo el Ecuador.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
