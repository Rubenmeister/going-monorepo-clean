import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Título/SEO propios de la sección corporativa. La landing y el panel de
// empresas son componentes cliente (no pueden exportar metadata), así que este
// layout de servidor les da un <title> distinto al genérico de la app.
export const metadata: Metadata = {
  title: 'Going App para Empresas',
  description:
    'Movilidad corporativa para tu negocio: gestiona viajes, aprobaciones y facturación en una sola plataforma.',
};

export default function EmpresasLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
