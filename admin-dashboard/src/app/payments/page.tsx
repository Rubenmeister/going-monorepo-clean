'use client';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { Button } from '@going-monorepo-clean/shared-ui';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function PaymentsManagementPage() {
  const { auth } = useMonorepoApp();
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.user) {
      router.push('/login');
      return;
    }

    const loadPayments = async () => {
      try {
        // TODO: Fetch payments from backend
        setPayments([
          {
            id: 'pay_1',
            bookingId: 'booking_1',
            amount: 150.00,
            currency: 'USD',
            status: 'succeeded',
            createdAt: '2025-01-10T10:30:00Z',
          },
          {
            id: 'pay_2',
            bookingId: 'booking_2',
            amount: 200.00,
            currency: 'USD',
            status: 'pending',
            createdAt: '2025-01-15T14:20:00Z',
          },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading payments:', error);
        setLoading(false);
      }
    };

    loadPayments();
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

  const stats = {
    total: payments.length,
    succeeded: payments.filter((p) => p.status === 'succeeded').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    totalAmount: payments
      .filter((p) => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="flex">
        <div className="flex-grow p-8">
          <h1 className="text-3xl font-bold mb-6 text-[#0033A0]">
            Gestión de Pagos
          </h1>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-gray-600 text-sm">Total Pagos</h3>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
              <h3 className="text-gray-600 text-sm">Completados</h3>
              <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <h3 className="text-gray-600 text-sm">Pendientes</h3>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-500">
              <h3 className="text-gray-600 text-sm">Éxito Rate</h3>
              <p className="text-2xl font-bold">
                {stats.total > 0
                  ? ((stats.succeeded / stats.total) * 100).toFixed(0)
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Transacciones Recientes</h2>

            {loading ? (
              <p>Cargando pagos...</p>
            ) : (
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 p-2 text-left">ID Pago</th>
                    <th className="border border-gray-300 p-2 text-left">Reserva</th>
                    <th className="border border-gray-300 p-2 text-left">Monto</th>
                    <th className="border border-gray-300 p-2 text-left">Estado</th>
                    <th className="border border-gray-300 p-2 text-left">Fecha</th>
                    <th className="border border-gray-300 p-2 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="border border-gray-300 p-2 text-sm">{payment.id}</td>
                      <td className="border border-gray-300 p-2 text-sm">{payment.bookingId}</td>
                      <td className="border border-gray-300 p-2">
                        ${payment.amount.toFixed(2)} {payment.currency}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            payment.status === 'succeeded'
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-sm">
                        {new Date(payment.createdAt).toLocaleDateString()}
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
