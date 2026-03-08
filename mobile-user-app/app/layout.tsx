import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Going — Tu compañero de viaje',
  description: 'Servicios de viaje en Ecuador',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
