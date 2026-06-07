import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Centro de ayuda | Going App Ecuador',
  description: 'Preguntas frecuentes sobre viajes, envíos, pagos y seguridad en Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
