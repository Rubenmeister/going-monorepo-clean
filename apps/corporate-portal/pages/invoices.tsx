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
}

const STATUS_STYLES: Record<InvoiceStatus, { bg: string; label: string }> = {
  draft: { bg: 'bg-gray-100 text-gray-600', label: 'Draft' },
  sent: { bg: 'bg-blue-100 text-blue-700', label: 'Sent' },
  paid: { bg: 'bg-green-100 text-green-700', label: 'Paid' },
  overdue: { bg: 'bg-red-100 text-red-700', label: 'Overdue' },
};

function normalizeStatus(s: string): InvoiceStatus {
  if (['draft', 'sent', 'paid', 'overdue'].includes(s)) return s as InvoiceStatus;
  return 'draft';
}

export default function Invoices() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = (session as any)?.accessToken ?? '';

  const loadInvoices = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await corpFetch<{ invoices?: Invoice[]; data?: Invoice[] }>(
        '/corporate/invoices',
        token
      );
      const raw = (data.invoices ?? data.data ?? []) as any[];
      setInvoices(
        raw.map((inv) => ({
          invoiceId: inv.invoiceId ?? inv._id ?? inv.id,
          invoiceNumber: inv.invoiceNumber ?? inv.number ?? '—',
          period: inv.period ?? inv.billingPeriod ?? '—',
          bookings: Number(inv.bookings ?? inv.bookingCount ?? 0),
          totalAmount: Number(inv.totalAmount ?? inv.amount ?? 0),
          currency: inv.currency ?? 'USD',
          status: normalizeStatus(inv.status),
          dueDate: inv.dueDate ?? inv.due_date ?? '',
          paidAt: inv.paidAt ?? inv.paid_at,
        }))
      );
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

  const downloadCSV = (invoice: Invoice) => {
    const rows = [
      ['Invoice Number', 'Period', 'Bookings', 'Total Amount', 'Status', 'Due Date'],
      [
        invoice.invoiceNumber,
        invoice.period,
        invoice.bookings,
        `${invoice.currency} ${invoice.totalAmount}`,
        invoice.status,
        invoice.dueDate,
      ],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unpaidTotal = invoices
    .filter((i) => i.status !== 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const paidTotal = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-500 mt-1">
            Consolidated monthly billing for your company
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Outstanding</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">
              {loading ? '…' : `$${unpaidTotal.toLocaleString()}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoices.filter((i) => i.status !== 'paid').length} invoice(s) pending
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Paid</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              {loading ? '…' : `$${paidTotal.toLocaleString()}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoices.filter((i) => i.status === 'paid').length} invoice(s)
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Total bookings</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {loading ? '…' : invoices.reduce((s, i) => s + i.bookings, 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">across all invoices</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
            <span>⚠️ {error}</span>
            <button onClick={loadInvoices} className="ml-auto text-xs underline">
              Retry
            </button>
          </div>
        )}

        {/* Invoice list */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm animate-pulse">
              Loading invoices…
            </div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🧾</p>
              <p className="font-medium">No invoices found.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Invoice
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Period
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Bookings
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.invoiceId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-sm text-gray-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{inv.period}</td>
                    <td className="px-6 py-4 text-gray-700">{inv.bookings}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {inv.currency} {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLES[inv.status].bg
                        }`}
                      >
                        {STATUS_STYLES[inv.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {inv.paidAt ? (
                        <span className="text-green-600">
                          Paid {new Date(inv.paidAt).toLocaleDateString()}
                        </span>
                      ) : inv.dueDate ? (
                        new Date(inv.dueDate).toLocaleDateString()
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => downloadCSV(inv)}
                          className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => alert('PDF generation coming soon')}
                          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}
