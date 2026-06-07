import { Nunito_Sans, Roboto } from 'next/font/google';
import { RootLayoutClient } from './RootLayoutClient';
import { PWARegister } from '@/components/PWARegister';
import './global.css';
// Side-effect import: registra listeners window.onerror + unhandledrejection
// que envían errores JS al cerebro-service. 10% sampling por sesión.
import '@/lib/cerebro-tracker';

// ── Fuentes oficiales Going App (Brand Guidelines 2024) ───────────────────────
// Cargadas via next/font/google que: (a) hace self-host automático, (b)
// expone CSS variables consumibles desde design-tokens.ts y Tailwind, y
// (c) elimina FOUC vs <link rel="stylesheet"> manual.
const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito-sans',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.goingec.com'),
  title: 'Going App Ecuador: Nos movemos contigo',
  description: 'Transporte compartido y privado entre ciudades del Ecuador. Reserva tu viaje en segundos.',
  applicationName: 'Going App Ecuador',
  appleWebApp: {
    capable: true,
    title: 'Going App',
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'es_EC',
    siteName: 'Going App',
    title: 'Going App Ecuador: Nos movemos contigo',
    description: 'La SuperApp de movilidad y servicios del Ecuador: viajes, envíos, alojamiento, tours y experiencias.',
    images: [{ url: '/images/going-hero.jpg', width: 1200, height: 630, alt: 'Going App Ecuador' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Going App Ecuador: Nos movemos contigo',
    description: 'La SuperApp de movilidad y servicios del Ecuador.',
    images: ['/images/going-hero.jpg'],
  },
};

export const viewport = {
  themeColor: '#FF4C41',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning className={`${nunitoSans.variable} ${roboto.variable}`}>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Going App" />
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png" />
      </head>
      <body className="bg-gray-50" style={{ fontFamily: 'var(--font-roboto), system-ui, sans-serif' }}>
        <PWARegister />
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
