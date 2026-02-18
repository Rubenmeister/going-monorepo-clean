import { AuthProvider } from '@going-monorepo-clean/frontend-providers';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
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
          <div className="flex flex-col md:flex-row min-h-screen">
            <Sidebar />
            <div className="flex flex-col flex-1 md:ml-0">
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}