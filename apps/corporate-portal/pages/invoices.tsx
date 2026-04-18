import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import { corpFetch } from '../lib/api';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  period: string;
  bookings: number;
  totalAmount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; bg: string; color: string; icon: string }> = {
  draft:   { label: 'Borrador', bg: '#f3f4f6', color: '#6b7280', icon: '📝' },
  sent:    { label: 'Enviada',  bg: '#dbeafe', color: '#1e40af', icon: '📨' },
  paid:    { label: 'Pagada',   bg: '#dcfce7', color: '#166534', icon: '✅' },
  overdue: { label: 'Vencida',  bg: '#fee2e2', color: '#991b1b', icon: '⚠️' },
};

function normalizeStatus(s: string): InvoiceStatus {
  if (['draft', 'sent', 'paid', 'overdue'].includes(s)) return s as InvoiceStatus;
  return 'draft';
}

export default function Invoices() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState([] as Invoice[]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);

  const token = (session as any)?.accessToken ?? '';

  const loadInvoices = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await corpFetch<any>('/corporate/invoices', token);
      const raw: any[] = data.invoices ?? data.data ?? (Array.isArray(data) ? data : []);
      setInvoices(raw.map(inv => ({
        invoiceId: inv.invoiceId ?? inv._id ?? inv.id,
        invoiceNumber: inv.invoiceNumber ?? inv.number ?? '—',
        period: inv.period ?? inv.billingPeriod ?? '—',
        bookings: Number(inv.bookings ?? inv.bookingCount ?? 0),
        totalAmount: Number(inv.totalAmount ?? inv.amount ?? 0),
        currency: inv.currency ?? 'USD',
        status: normalizeStatus(inv.status),
        dueDate: inv.dueDate ?? inv.due_date ?? '',
        paidAt: inv.paidAt ?? inv.paid_at,
        paymentMethod: inv.paymentMethod,
      })));
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
    if (status === 'authenticated') loadInvoices();
  }, [status, loadInvoices]);

  const downloadCSV = (inv: Invoice) => {
    const rows = [
      ['N° Factura', 'Período', 'Reservas', 'Total', 'Estado', 'Vencimiento'],
      [inv.invoiceNumber, inv.period, inv.bookings, `${inv.currency} ${inv.totalAmount}`, STATUS_CONFIG[inv.status].label, inv.dueDate],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${inv.invoiceNumber}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const outstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.totalAmount, 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-sm text-gray-500 mt-0.5">Historial de facturas y pagos corporativos Going</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Por cobrar</p>
              <span className="text-xl">💰</span>
            </div>
            <p className="text-3xl font-black text-orange-600">
              {loading ? '…' : `$${outstanding.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoices.filter(i => i.status !== 'paid').length} factura{invoices.filter(i => i.status !== 'paid').length !== 1 ? 's' : ''} pendiente{invoices.filter(i => i.status !== 'paid').length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">Pagado</p>
              <span className="text-xl">✅</span>
            </div>
            <p className="text-3xl font-black text-green-600">
              {loading ? '…' : `$${paid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoices.filter(i => i.status === 'paid').length} factura{invoices.filter(i => i.status === 'paid').length !== 1 ? 's' : ''} pagada{invoices.filter(i => i.status === 'paid').length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className={`rounded-2xl border shadow-sm p-5 ${overdueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm ${overdueCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>Vencidas</p>
              <span className="text-xl">⚠️</span>
            </div>
            <p className={`text-3xl font-black ${overdueCount > 0 ? 'text-red-700' : 'text-gray-400'}`}>
              {loading ? '…' : overdueCount}
            </p>
            <p className={`text-xs mt-1 ${overdueCount > 0 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {overdueCount > 0 ? 'Requieren atención inmediata' : 'Sin facturas vencidas'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-3">
            ⚠️ {error}
            <button onClick={loadInvoices} className="ml-auto underline text-xs">Reintentar</button>
          </div>
        )}

        {/* Invoice table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-14 text-center text-gray-400">
              <p className="text-5xl mb-3">🧾</p>
              <p className="font-medium text-gray-600">No hay facturas todavía</p>
              <p className="text-sm mt-1">Las facturas se generan al final de cada período de facturación</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6', backgroundColor: '#fafafa' }}>
                    {['N° Factura', 'Período', 'Reservas', 'Total', 'Estado', 'Vencimiento', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const sc = STATUS_CONFIG[inv.status];
                    const isOverdue = inv.status === 'overdue';
                    return (
                      <tr key={inv.invoiceId} className={`border-b border-gray-50 hover:bg-gray-50 transition ${isOverdue ? 'bg-red-50/40' : ''}`}>
                        <td className="px-5 py-4">
                          <p className="font-mono text-sm font-semibold text-gray-800">{inv.invoiceNumber}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700 font-medium">{inv.period}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700">{inv.bookings} reserva{inv.bookings !== 1 ? 's' : ''}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm font-bold text-gray-900">
                            {inv.currency} {inv.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: sc.bg, color: sc.color }}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {inv.paidAt ? (
                            <p className="text-xs text-green-600 font-medium">
                              Pagado el {new Date(inv.paidAt).toLocaleDateString('es-ES')}
                            </p>
                          ) : inv.dueDate ? (
                            <p className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                              {isOverdue ? '⚠️ ' : ''}{new Date(inv.dueDate).toLocaleDateString('es-ES')}
                            </p>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => downloadCSV(inv)}
                              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition font-medium">
                              CSV
                            </button>
                            <button onClick={() => alert('Descarga PDF próximamente')}
                              className="text-xs px-3 py-1.5 rounded-lg text-white font-medium hover:opacity-90 transition"
                              style={{ backgroundColor: '#ff4c41' }}>
                              PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="font-semibold text-gray-800 text-sm mb-1">Condiciones de pago Going Empresas</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Las facturas se generan el primer día de cada mes por los servicios del período anterior.
                El plazo estándar es <strong>30 días</strong> desde la fecha de emisión.
                Pago por transferencia bancaria o tarjeta corporativa autorizada.
                Para facturas vencidas, contacta a <strong>empresas@goingec.com</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
