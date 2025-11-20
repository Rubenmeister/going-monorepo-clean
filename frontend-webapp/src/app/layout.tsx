import { AuthProvider } from '@going-monorepo-clean/frontend-providers'; 
// Asegúrate de que este path es correcto y que tu global.css existe:
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
      <body>
        {/* Envuelve TODA la aplicación con el AuthProvider */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}