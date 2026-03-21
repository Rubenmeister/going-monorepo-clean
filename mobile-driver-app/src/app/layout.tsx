import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Going Conductor',
  description: 'App para conductores Going',
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
