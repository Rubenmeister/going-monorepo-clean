import { AuthProvider } from '@going-monorepo-clean/frontend-providers'; 
import './global.css'; // Asume que tienes un archivo global.css

export const metadata = {
  title: 'Going Dashboard: Administración',
  description: 'Panel de control de Going Monorepo.',
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