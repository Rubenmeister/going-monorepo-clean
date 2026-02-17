'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BookingsManagementPage() {
  const { auth, domain } = useMonorepoApp();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) {
      router.push('/login');
      return;
    }

    const loadBookings = async () => {
      try {
        // Fetch all bookings for all users
        // Note: In a real app, you'd have a backend endpoint to fetch all bookings
        setLoading(false);
      } catch (error) {
        console.error('Error loading bookings:', error);
        setLoading(false);
      }
    };

    loadBookings();
  }, [auth.user, router]);

  if (auth.isLoading) {
    return <div className="p-10 text-xl text-center">Cargando...</div>;
  }

  if (!auth.user?.isAdmin?.()) {
    return (
      <div className="p-10 text-center text-red-600">
        ACCESO DENEGADO - Se requiere rol de administrador
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">
        <div className="flex-grow p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#0033A0]">
            Gestión de Reservas
          </h1>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reservas Activas</h2>

            {loading ? (
              <p>Cargando reservas...</p>
            ) : bookings.length === 0 ? (
              <p className="text-gray-500">No hay reservas para mostrar</p>
            ) : (
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left">ID</th>
                    <th className="border border-gray-300 p-2 text-left">Usuario</th>
                    <th className="border border-gray-300 p-2 text-left">Tipo</th>
                    <th className="border border-gray-300 p-2 text-left">Estado</th>
                    <th className="border border-gray-300 p-2 text-left">Precio</th>
                    <th className="border border-gray-300 p-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="border border-gray-300 p-2">{booking.id}</td>
                      <td className="border border-gray-300 p-2">{booking.userId}</td>
                      <td className="border border-gray-300 p-2">{booking.serviceType}</td>
                      <td className="border border-gray-300 p-2">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2">
                        ${booking.totalPrice?.amount || 0}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Button variant="primary" className="text-sm">
                          Ver
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <Button
            onClick={() => router.push('/')}
            variant="secondary"
            className="mt-8"
          >
            Volver al Dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
