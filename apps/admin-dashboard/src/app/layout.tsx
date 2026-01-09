import { Inter } from 'next/font/google';
import './global.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Going Admin Dashboard',
  description: 'Panel de operaciones de Going.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}