import Layout from '../components/Layout';
import BookingFormModal, { BookingPayload } from '../components/BookingFormModal';
import { useSession } from '../lib/auth';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { corpFetch } from '../lib/api';

interface Booking {
  id: string;
  requester: string;
  department?: string;
  serviceType: string;
  origin?: string;
  destination?: string;
  city?: string;
  tourName?: string;
  experienceType?: string;
  scheduledDate?: string;
  checkIn?: string;
  tourDate?: string;
  experienceDate?: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  amount: number;
  paymentMethod?: string;
  approvedBy?: string;
  mode?: string;
  createdAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending:     'Pendiente',
  confirmed:   'Confirmada',
  in_progress: 'En curso',
  completed:   'Completada',
  cancelled:   'Cancelada',
};
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:     { bg: '#fef9c3', text: '#854d0e' },
  confirmed:   { bg: '#dbeafe', text: '#1e40af' },
  in_progress: { bg: '#f3e8ff', text: '#6b21a8' },
  completed:   { bg: '#dcfce7', text: '#166534' },
  cancelled:   { bg: '#f3f4f6', text: '#6b7280' },
};

const SERVICE_ICONS: Record<string, string> = {
  transport:     '🚗',
  tour:          '🗺️',
  experience:    '🎭',
  accommodation: '🏨',
};
const SERVICE_LABELS: Record<string, string> = {
  transport:     'Transporte',
  tour:          'Tour',
  experience:    'Experiencia',
  accommodation: 'Alojamiento',
};

const PAYMENT_LABELS: Record<string, string> = {
  corporate_card:  '💳 Tarjeta corporativa',
  invoice_30:      '🧾 Factura 30 días',
  cash_transfer:   '🏦 Transferencia',
  agency_invoice:  '✈️ Factura agencia',
};

function bookingSubtitle(b: Booking): string {
  if (b.serviceType === 'transport') return `${b.origin ?? '—'} → ${b.destination ?? '—'}`;
  if (b.serviceType === 'tour') return b.tourName ?? '—';
  if (b.serviceType === 'experience') return b.experienceType ?? '—';
  if (b.serviceType === 'accommodation') return b.city ?? '—';
  return '—';
}

function bookingDate(b: Booking): string {
  const raw = b.scheduledDate ?? b.checkIn ?? b.tourDate ?? b.experienceDate ?? b.createdAt;
  if (!raw) return '—';
  try { return new Date(raw).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return raw; }
}

const FILTERS = ['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

function normalizeBooking(b: any): Booking {
  return {
    id: b.id ?? b._id ?? String(Math.random()),
    requester: b.requesterName ?? b.employeeName ?? b.userId ?? '—',
    department: b.department,
    serviceType: b.serviceType ?? b.type ?? 'transport',
    origin: b.origin ?? b.pickup,
    destination: b.destination ?? b.dropoff,
    city: b.city,
    tourName: b.tourName,
    experienceType: b.experienceType,
    scheduledDate: b.scheduledDate ?? b.date,
    checkIn: b.checkIn,
    tourDate: b.tourDate,
    experienceDate: b.experienceDate,
    status: b.status ?? 'pending',
    amount: Number(b.estimatedAmount ?? b.totalPrice?.amount ?? b.amount ?? 0),
    paymentMethod: b.paymentMethod,
    approvedBy: b.approvedBy ?? b.approvedByName,
    mode: b.mode,
    createdAt: b.createdAt,
  };
}

export default function BookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState([] as Booking[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null as { msg: string; ok: boolean } | null);
  const [expanded, setExpanded] = useState(null as string | null);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  const load = useCallback(async () => {
    if (!(session as any)?.accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await corpFetch<any>('/corporate/bookings', (session as any).accessToken);
      const list: any[] = Array.isArray(data) ? data : data?.bookings ?? data?.data ?? [];
      setBookings(list.map(normalizeBooking));
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

  const handleNewBooking = async (payload: BookingPayload) => {
    setShowModal(false);
    if (!(session as any)?.accessToken) return;
    try {
      await corpFetch('/corporate/bookings', (session as any).accessToken, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast(
        payload.mode === 'direct'
          ? 'Reserva creada correctamente. El equipo de Operaciones asignará el servicio.'
          : 'Solicitud enviada. Pendiente de aprobación del manager.',
        true
      );
      load();
    } catch (e: any) {
      showToast(`No se pudo crear la reserva: ${e.message}`, false);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const counts = FILTERS.slice(1).reduce((acc, f) => {
    acc[f] = bookings.filter(b => b.status === f).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      {showModal && <BookingFormModal onClose={() => setShowModal(false)} onSubmit={handleNewBooking} />}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 max-w-sm px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white flex items-start gap-2 ${toast.ok ? 'bg-green-600' : 'bg-red-600'}`}>
          <span className="flex-shrink-0">{toast.ok ? '✅' : '⚠️'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservas Corporativas</h1>
            <p className="text-sm text-gray-500 mt-0.5">{bookings.length} reserva{bookings.length !== 1 ? 's' : ''} en total</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm hover:opacity-90 transition flex items-center gap-2"
            style={{ backgroundColor: '#ff4c41' }}>
            + Nueva Reserva
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {FILTERS.slice(1).map(f => {
            const sc = STATUS_COLORS[f];
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-xl p-3 text-center transition border-2 ${filter === f ? 'border-[#ff4c41]' : 'border-transparent'}`}
                style={{ backgroundColor: sc.bg }}>
                <p className="text-xl font-bold" style={{ color: sc.text }}>{counts[f] ?? 0}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: sc.text }}>{STATUS_LABELS[f]}</p>
              </button>
            );
          })}
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
              style={filter === f ? { backgroundColor: '#ff4c41' } : {}}>
              {f === 'all' ? `Todas (${bookings.length})` : `${STATUS_LABELS[f]} (${counts[f] ?? 0})`}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-center gap-3">
            ⚠️ {error}
            <button onClick={load} className="ml-auto underline text-xs">Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center border border-gray-100 shadow-sm">
            <p className="text-5xl mb-3">📋</p>
            <p className="text-gray-500 font-medium">No hay reservas {filter !== 'all' && STATUS_LABELS[filter]?.toLowerCase() + 's'}</p>
            <button onClick={() => setShowModal(true)}
              className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white inline-block"
              style={{ backgroundColor: '#ff4c41' }}>
              + Crear primera reserva
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(b => {
              const sc = STATUS_COLORS[b.status] ?? STATUS_COLORS.pending;
              const isOpen = expanded === b.id;
              return (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <button
                    type="button"
                    className="w-full text-left px-5 py-4 flex items-start gap-4"
                    onClick={() => setExpanded(isOpen ? null : b.id)}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: sc.bg }}>
                      {SERVICE_ICONS[b.serviceType] ?? '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{b.requester}</span>
                        {b.department && <span className="text-xs text-gray-400">· {b.department}</span>}
                        {b.mode === 'approval' && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">requiere aprobación</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">
                        <span className="font-medium">{SERVICE_LABELS[b.serviceType] ?? b.serviceType}</span>
                        {' · '}{bookingSubtitle(b)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{bookingDate(b)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: sc.bg, color: sc.text }}>
                        {STATUS_LABELS[b.status]}
                      </span>
                      <span className="font-bold text-gray-900 text-sm">${b.amount.toFixed(2)}</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="px-5 pb-4 border-t border-gray-50 pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {b.paymentMethod && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Método de pago</p>
                          <p className="font-medium text-gray-700">{PAYMENT_LABELS[b.paymentMethod] ?? b.paymentMethod}</p>
                        </div>
                      )}
                      {b.approvedBy && (
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">Aprobado por</p>
                          <p className="font-medium text-gray-700">{b.approvedBy}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">ID de reserva</p>
                        <p className="font-mono text-xs text-gray-500">{b.id}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
