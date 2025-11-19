'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui'; 
import { useRouter } from 'next/navigation'; // Para redireccionar

export default function DashboardPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  
  // 1. Lógica de Redirección y Seguridad
  if (auth.isLoading) {
    return <div className="p-10 text-xl text-center">Cargando sesión...</div>;
  }
  
  // Si no está logueado, redirigir a la página de login (o mostrar un mensaje)
  if (!auth.user) {
    router.push('/login'); // Asumiendo que crearás apps/admin-dashboard/src/app/login/page.tsx
    return null;
  }

  // 2. Comprobación de Rol (La Seguridad del Dashboard)
  if (!auth.user.isAdmin()) {
    // Si no es admin, mostrar mensaje de error
    return (
      <div className="p-10 text-center text-red-600 font-semibold bg-red-50 border border-red-300 rounded-lg mx-auto mt-20 max-w-lg">
        <h1 className="text-2xl mb-4">ACCESO DENEGADO</h1>
        <p>Tu rol ({auth.user.roles.join(', ')}) no tiene permiso para acceder al panel de administración.</p>
        <Button onClick={auth.logout} variant="secondary" className="mt-4">
            Cerrar Sesión
        </Button>
      </div>
    );
  }

  // 3. Renderizado del Dashboard (Solo si es Admin)
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Aquí iría un componente de Sidebar (Navegación) */}
        
        <div className="flex-grow p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#0033A0]">
            Panel de Administración - Resumen
          </h1>
          
          <p className="mb-4">Bienvenido, {auth.user.firstName}. Tienes acceso total.</p>

          <Button onClick={auth.logout} variant="secondary" className="mt-8">
            Cerrar Sesión
          </Button>
          
        </div>
      </div>
    </main>
  );
}