import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Academia Going App | Formación gratuita',
  description: 'Cursos gratuitos de microlearning para conductores, anfitriones, guías, operadores y viajeros: texto, manual gráfico, podcast, video y quizzes.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
