'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui'; // Usamos el Button compartido

export default function HomePage() {
  // 1. Conexión central a toda la lógica Hexagonal
  const { auth, domain } = useMonorepoApp();
  
  const handleTestLogin = () => {
    // 2. Llamada directa al Caso de Uso de Login
    domain.auth.login({ email: 'test@example.com', password: 'password123' });
  };
  
  const handleTestTrip = () => {
    // 3. Llamada directa a un Caso de Uso de Transport
    if (auth.user) {
        // Los datos deben venir de un formulario real en la UI
        domain.transport.requestTrip({
            userId: auth.user.id,
            origin: { address: 'Quito', city: 'Quito', country: 'EC', latitude: -0.18, longitude: -78.47 },
            destination: { address: 'Guayaquil', city: 'Guayaquil', country: 'EC', latitude: -2.18, longitude: -79.88 },
            price: { amount: 5000, currency: 'USD' } // $50.00
        });
    }
  };

  return (
    <main className="min-h-screen p-24">
      <h1 className="text-4xl font-bold text-[#0033A0]">
        Going Monorepo Web App
      </h1>
      
      <div className="mt-8 space-y-4">
        {auth.isLoading && <p>Cargando sesión...</p>}
        {auth.error && <p className="text-red-500">Error de Autenticación: {auth.error}</p>}
        
        {/* Comprobación de si el usuario está logueado */}
        {auth.user ? (
          <div className="space-y-2">
            <p className="text-xl">¡Bienvenido, {auth.user.firstName}!</p>
            <p className="text-sm">Tu rol: {auth.user.roles.join(', ')}</p>
            <Button onClick={handleTestTrip} variant="accent" className="mr-4">
                Solicitar Viaje de Prueba
            </Button>
            <Button onClick={auth.logout} variant="secondary">
                Cerrar Sesión
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p>Estado: Desconectado</p>
            <Button onClick={handleTestLogin}>
              Iniciar Sesión (Test)
            </Button>
          </div>
        )}
        
      </div>
    </main>
  );
}