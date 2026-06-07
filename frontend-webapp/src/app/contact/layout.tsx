import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto | Going App Ecuador',
  description: 'Escríbenos por WhatsApp o déjanos tu mensaje. Estamos para ayudarte con tus viajes, envíos y servicios.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
