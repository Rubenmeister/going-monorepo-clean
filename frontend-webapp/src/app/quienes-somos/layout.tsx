import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quiénes somos | Going App Ecuador',
  description: 'Conoce la visión, la misión y el equipo de Going App, la SuperApp de movilidad y servicios del Ecuador.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
