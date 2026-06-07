import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Para pasajeros | Going App Ecuador',
  description: 'Viaja compartido o privado entre ciudades del Ecuador. Reserva en segundos con Going App.',
};

// Layout de ruta pública — solo define metadata SEO de la sección.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
