import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Curso · Academia Going App',
  description: 'Capacitación de la Academia Going App: aprende a tu ritmo en texto/PDF, manual gráfico, podcast y video.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
