'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, authFetch } from '../store';
import AppShell from '../components/AppShell';

interface Booking {
  id: string;
  serviceType: string;
  status: string;
  totalPrice: { amount: number; currency: string };
  startDate: string;
}

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#f59e0b', bg: '#fffbeb' },
  confirmed: { label: 'Confirmado', color: '#22c55e', bg: '#f0fdf4' },
  completed: { label: 'Completado', color: '#6b7280', bg: '#f9fafb' },
  cancelled: { label: 'Cancelado', color: '#ef4444', bg: '#fef2f2' },
};

const SVC_ICONS: Record<string, string> = {
  transport: '🚗',
  accommodation: '🏠',
  tour: '🎫',
  experience: '🎭',
};

export default function BookingsPage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init();
  }, [init]);
  useEffect(() => {
    if (isReady && !token) router.replace('/login');
  }, [isReady, token, router]);

  useEffect(() => {
    if (!user) return;
    authFetch(`/bookings/user/${user.id}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setBookings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AppShell title="Mis Reservas">
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Mis Reservas</h2>

        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }}
            />
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="font-semibold text-gray-700 mb-1">Sin reservas</p>
            <p className="text-sm text-gray-400 mb-6">
              Todavía no tienes reservas activas
            </p>
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Explorar servicios
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => {
              const st = STATUS[b.status] ?? STATUS.pending;
              const icon = SVC_ICONS[b.serviceType?.toLowerCase()] ?? '📦';
              return (
                <div key={b.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 capitalize">
                          {b.serviceType}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(b.startDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: st.bg, color: st.color }}
                    >
                      {st.label}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-400">Total</p>
                    <p
                      className="font-bold text-sm"
                      style={{ color: '#ff4c41' }}
                    >
                      ${b.totalPrice?.amount ?? 0}{' '}
                      {b.totalPrice?.currency ?? 'USD'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
