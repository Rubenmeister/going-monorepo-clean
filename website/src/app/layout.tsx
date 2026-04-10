import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

export const metadata: Metadata = {
  title: 'Going Ecuador — Nos movemos contigo',
  description: 'Viajes compartidos, privados, envíos y tours en Ecuador. La plataforma de movilidad más segura del país.',
  keywords: 'transporte Ecuador, viajes compartidos, Quito, Guayaquil, Going',
  openGraph: {
    title: 'Going Ecuador',
    description: 'Nos movemos contigo',
    url: 'https://goingec.com',
    siteName: 'Going Ecuador',
    locale: 'es_EC',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
