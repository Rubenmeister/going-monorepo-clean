import { AuthProvider } from '@going-monorepo-clean/frontend-providers';
import { Sidebar } from './components/Sidebar';
import './global.css';

export const metadata = {
  title: 'Going Ecuador: Reserva tu aventura',
  description: 'Transporte, tours y alojamiento en un solo lugar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50">
        <AuthProvider>
          <Sidebar />
          <main className="ml-64">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}