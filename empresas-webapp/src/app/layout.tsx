import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './global.css';

// App corporativa independiente (empresas.goingec.com). Extraída de
// frontend-webapp (2026-07-17) a su propio proyecto para desacoplarla del
// producto consumidor. Rutas en la raíz: /, /auth/login, /panel/*, /solicitud.
export const metadata: Metadata = {
  title: {
    default: 'Going App para Empresas',
    template: '%s · Going App Empresas',
  },
  description:
    'Movilidad corporativa para tu negocio: gestiona viajes, aprobaciones y facturación en una sola plataforma.',
  applicationName: 'Going App Empresas',
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-slate-50">{children}</body>
    </html>
  );
}
