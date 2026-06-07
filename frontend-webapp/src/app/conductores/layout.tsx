import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conduce con Going App | Ecuador',
  description: 'Genera ingresos conduciendo con Going App. Regístrate como conductor en Ecuador.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
