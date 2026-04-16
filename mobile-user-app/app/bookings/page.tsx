'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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

const FILTERS = ['Todos', 'Pendiente', 'Confirmado', 'Completado', 'Cancelado'];

export default function BookingsPage() {
  const { user, token, isReady, init } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos');

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

  const filtered =
    filter === 'Todos'
      ? bookings
      : bookings.filter((b) => STATUS[b.status]?.label === filter);

  return (
    <AppShell title="Historial">
      {/* Header */}
      <div className="px-4 py-5" style={{ backgroundColor: '#011627' }}>
        <h1 className="text-lg font-black text-white mb-1">Mis Reservas</h1>
        <p className="text-sm text-white/40">
          Historial completo de tus servicios
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto shadow-sm">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex-shrink-0"
            style={
              filter === f
                ? { backgroundColor: '#ff4c41', color: '#fff' }
                : { backgroundColor: '#f1f5f9', color: '#6b7280' }
            }
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 border-4 rounded-full animate-spin"
              style={{ borderColor: '#ff4c41', borderTopColor: 'transparent' }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="text-5xl mb-4">📋</span>
            <p className="font-bold text-gray-700 mb-1">Sin reservas</p>
            <p className="text-sm text-gray-400 mb-6">
              {filter === 'Todos'
                ? 'Todavía no tienes reservas'
                : `No hay reservas con estado "${filter}"`}
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
            <p className="text-xs text-gray-400 font-medium mb-2">
              {filtered.length} reserva{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map((b) => {
              const st = STATUS[b.status] ?? STATUS.pending;
              const icon = SVC_ICONS[b.serviceType?.toLowerCase()] ?? '📦';
              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: '#f8fafc' }}
                      >
                        {icon}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900 capitalize">
                          {b.serviceType}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(b.startDate).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
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
                  <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                    <p className="text-xs text-gray-400">Total pagado</p>
                    <p
                      className="font-black text-base"
                      style={{ color: '#ff4c41' }}
                    >
                      ${b.totalPrice?.amount ?? 0}{' '}
                      <span className="text-xs font-normal text-gray-400">
                        {b.totalPrice?.currency ?? 'USD'}
                      </span>
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
