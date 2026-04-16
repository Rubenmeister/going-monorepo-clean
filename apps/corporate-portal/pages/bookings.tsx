import Layout from '../components/Layout';
import BookingFormModal from '../components/BookingFormModal';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { corpFetch } from '../lib/api';

interface Booking {
  id: string;
  employee: string;
  serviceType: string;
  origin: string;
  destination: string;
  date: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  approvedBy?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', confirmed: 'Confirmada', in_progress: 'En curso',
  completed: 'Completada', cancelled: 'Cancelada',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700', completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await corpFetch<any>('/corporate/bookings', session.accessToken as string);
      const list: any[] = Array.isArray(data) ? data : data?.bookings ?? data?.data ?? [];
      setBookings(list.map((b: any) => ({
        id: b.id ?? b._id,
        employee: b.employeeName ?? b.userId ?? '—',
        serviceType: b.serviceType ?? b.type ?? 'Transporte',
        origin: b.origin ?? b.pickup ?? '—',
        destination: b.destination ?? b.dropoff ?? '—',
        date: b.scheduledAt ?? b.date ?? b.createdAt ?? '',
        status: b.status ?? 'pending',
        amount: b.totalPrice ?? b.amount ?? 0,
        approvedBy: b.approvedBy ?? b.approvedByName,
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated') load();
  }, [status, router, load]);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  return (
    <Layout>
      {showModal && (
        <BookingFormModal
          onClose={() => setShowModal(false)}
          onSubmit={async (data) => {
            setShowModal(false);
            if (!session?.accessToken) return;
            try {
              await corpFetch('/corporate/bookings', session.accessToken as string, {
                method: 'POST',
                body: JSON.stringify(data),
              });
            } catch {
              // silently ignore — booking may still be queued
            }
            load();
          }}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Reservas Corporativas</h1>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: '#ff4c41' }}>
            + Nueva Reserva
          </button>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            ⚠️ {error} — <button onClick={load} className="underline">Reintentar</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
              style={filter === f ? { backgroundColor: '#ff4c41' } : {}}>
              {f === 'all' ? 'Todas' : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400">No hay reservas {filter !== 'all' ? STATUS_LABELS[filter]?.toLowerCase() + 's' : ''}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 text-sm">{b.employee}</span>
                      <span className="text-xs text-gray-400">· {b.serviceType}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{b.origin} → {b.destination}</p>
                    <p className="text-xs text-gray-400 mt-1">{b.date ? new Date(b.date).toLocaleString('es-ES') : '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                    <span className="font-bold text-gray-900 text-sm">${Number(b.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
