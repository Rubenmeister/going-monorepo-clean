import { AuthProvider } from '@/lib/providers';
import './global.css'; // Asume que tienes un archivo global.css
// Side-effect import: registra listeners window.onerror + unhandledrejection
// que envían errores JS al cerebro-service. 10% sampling por sesión.
import '../lib/cerebro-tracker';

export const metadata = {
  title: 'Going App Dashboard: Administración',
  description: 'Panel de control de Going App Monorepo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}