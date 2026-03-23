import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Going Empresas — Portal Corporativo',
  description: 'Gestiona los viajes y servicios corporativos de tu empresa.',
};

export default function EmpresasRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
