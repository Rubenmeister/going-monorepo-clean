import Layout from '../components/Layout';
import { useSession } from '../lib/auth';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { corpFetch } from '../lib/api';

type ServiceType = 'transport' | 'accommodation' | 'tour' | 'experience';

interface ApprovalRequest {
  workflowId: string;
  bookingId: string;
  requester: { id: string; name: string; department?: string };
  serviceType: ServiceType;
  totalPrice: { amount: number; currency: string };
  origin?: string;
  destination?: string;
  city?: string;
  tourName?: string;
  experienceType?: string;
  scheduledDate?: string;
  checkIn?: string;
  tourDate?: string;
  passengers?: number;
  groupSize?: number;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  urgency: 'low' | 'medium' | 'high';
}

const SERVICE_ICONS: Record<ServiceType, string> = {
  transport: '🚗', accommodation: '🏨', tour: '🗺️', experience: '🎭',
};
const SERVICE_LABELS: Record<ServiceType, string> = {
  transport: 'Transporte', accommodation: 'Alojamiento', tour: 'Tour', experience: 'Experiencia',
};
const URGENCY: Record<string, { label: string; bg: string; color: string }> = {
  low:    { label: 'Baja prioridad',  bg: '#f3f4f6', color: '#6b7280' },
  medium: { label: 'Media prioridad', bg: '#fef9c3', color: '#854d0e' },
  high:   { label: 'Alta prioridad',  bg: '#fee2e2', color: '#991b1b' },
};
const PAYMENT_LABELS: Record<string, string> = {
  corporate_card: '💳 Tarjeta corporativa',
  invoice_30:     '🧾 Factura 30 días',
  cash_transfer:  '🏦 Transferencia',
  agency_invoice: '✈️ Factura agencia',
};

function requestDetail(req: ApprovalRequest): string {
  if (req.serviceType === 'transport') return `${req.origin ?? '—'} → ${req.destination ?? '—'}`;
  if (req.serviceType === 'tour') return req.tourName ?? '—';
  if (req.serviceType === 'experience') return req.experienceType ?? '—';
  if (req.serviceType === 'accommodation') return req.city ?? '—';
  return '—';
}
function requestDate(req: ApprovalRequest): string {
  const raw = req.scheduledDate ?? req.checkIn ?? req.tourDate;
  if (!raw) return '—';
  try { return new Date(raw).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return raw; }
}

export default function Approvals() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState([] as ApprovalRequest[]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null as string | null);
  const [history, setHistory] = useState([] as { workflowId: string; decision: 'approved' | 'rejected'; name: string; time: Date }[]);
  const [error, setError] = useState(null as string | null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null as string | null);

  const token = (session as any)?.accessToken ?? '';

  const loadApprovals = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await corpFetch<any>('/corporate/approvals/pending', token);
      const list = data.approvals ?? data.data ?? data ?? [];
      setPending(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);
  useEffect(() => {
    if (status === 'authenticated') loadApprovals();
  }, [status, loadApprovals]);

  const decide = async (workflowId: string, decision: 'approved' | 'rejected', note?: string) => {
    setProcessing(workflowId);
    try {
      await corpFetch(`/corporate/approvals/${workflowId}/decide`, token, {
        method: 'POST',
        body: JSON.stringify({ decision, ...(note ? { note } : {}) }),
      });
      const req = pending.find(r => r.workflowId === workflowId);
      if (req) setHistory(prev => [{ workflowId, decision, name: req.requester.name, time: new Date() }, ...prev]);
      setPending(prev => prev.filter(r => r.workflowId !== workflowId));
      setRejectTarget(null);
      setRejectNote('');
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setProcessing(null);
    }
  };

  if (status === 'loading') return null;

  const approvedCount = history.filter(h => h.decision === 'approved').length;
  const rejectedCount = history.filter(h => h.decision === 'rejected').length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aprobaciones</h1>
          <p className="text-sm text-gray-500 mt-0.5">Autoriza las solicitudes de reserva de tu equipo</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{loading ? '…' : pending.length}</p>
            <p className="text-xs font-semibold text-amber-700 mt-1">Por revisar</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-green-600">{approvedCount}</p>
            <p className="text-xs font-semibold text-green-700 mt-1">Aprobadas hoy</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-600">{rejectedCount}</p>
            <p className="text-xs font-semibold text-red-700 mt-1">Rechazadas hoy</p>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
            ⚠️ {error}
            <button onClick={loadApprovals} className="ml-auto underline text-xs">Reintentar</button>
          </div>
        )}

        {/* Pending list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-14 text-center border border-gray-100 shadow-sm">
            <p className="text-5xl mb-3">✅</p>
            <p className="text-gray-700 font-semibold text-lg">¡Al día!</p>
            <p className="text-gray-400 text-sm mt-1">No hay solicitudes pendientes de aprobación</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map(req => {
              const urg = URGENCY[req.urgency] ?? URGENCY.low;
              const isRejecting = rejectTarget === req.workflowId;
              return (
                <div key={req.workflowId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Main row */}
                  <div className="p-5 flex items-start gap-4 flex-wrap">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
                      style={{ backgroundColor: '#ff4c41' }}>
                      {req.requester.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{req.requester.name}</span>
                        {req.requester.department && (
                          <span className="text-xs text-gray-400">· {req.requester.department}</span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: urg.bg, color: urg.color }}>
                          {urg.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span>{SERVICE_ICONS[req.serviceType]}</span>
                        <span className="font-semibold text-gray-800">{SERVICE_LABELS[req.serviceType]}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600">{requestDetail(req)}</span>
                      </div>

                      <div className="flex gap-4 mt-2 text-xs text-gray-500 flex-wrap">
                        {requestDate(req) !== '—' && <span>📅 {requestDate(req)}</span>}
                        {req.passengers && <span>👤 {req.passengers} pax</span>}
                        {req.groupSize && <span>👥 {req.groupSize} personas</span>}
                        {req.paymentMethod && <span>{PAYMENT_LABELS[req.paymentMethod] ?? req.paymentMethod}</span>}
                      </div>

                      {req.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 rounded-lg px-3 py-2">
                          &ldquo;{req.notes}&rdquo;
                        </p>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        Solicitado el {new Date(req.createdAt).toLocaleString('es-ES')}
                      </p>
                    </div>

                    {/* Price + actions */}
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-black text-gray-900">
                          ${req.totalPrice.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">{req.totalPrice.currency}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectTarget(isRejecting ? null : req.workflowId)}
                          disabled={processing === req.workflowId}
                          className="px-4 py-2 rounded-xl border border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50">
                          Rechazar
                        </button>
                        <button
                          onClick={() => decide(req.workflowId, 'approved')}
                          disabled={processing === req.workflowId}
                          className="px-4 py-2 rounded-xl text-white text-sm font-bold transition disabled:opacity-50 hover:opacity-90"
                          style={{ backgroundColor: '#ff4c41' }}>
                          {processing === req.workflowId ? 'Procesando…' : '✓ Aprobar'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reject reason panel */}
                  {isRejecting && (
                    <div className="px-5 pb-4 border-t border-gray-100 pt-4 bg-red-50">
                      <p className="text-sm font-semibold text-red-700 mb-2">Motivo de rechazo (opcional)</p>
                      <textarea
                        rows={2}
                        className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
                        placeholder="Ej: Presupuesto superado, fecha no disponible…"
                        value={rejectNote}
                        onChange={e => setRejectNote(e.target.value)}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => { setRejectTarget(null); setRejectNote(''); }}
                          className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                          Cancelar
                        </button>
                        <button onClick={() => decide(req.workflowId, 'rejected', rejectNote)}
                          disabled={processing === req.workflowId}
                          className="flex-1 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50">
                          Confirmar rechazo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3">Decisiones de esta sesión</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className="text-lg">{h.decision === 'approved' ? '✅' : '❌'}</span>
                  <span className="text-sm text-gray-700 flex-1">
                    <span className="font-semibold">{h.name}</span>
                    {' — '}
                    <span className={h.decision === 'approved' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {h.decision === 'approved' ? 'aprobada' : 'rechazada'}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400">
                    {h.time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
