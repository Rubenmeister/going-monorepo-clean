import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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

const MOCK_INVOICES: Invoice[] = [
  {
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-2026-02',
    period: 'February 2026',
    bookings: 12,
    totalAmount: 980,
    currency: 'USD',
    status: 'draft',
    dueDate: '2026-03-15',
  },
  {
    invoiceId: 'inv-002',
    invoiceNumber: 'INV-2026-01',
    period: 'January 2026',
    bookings: 20,
    totalAmount: 1650,
    currency: 'USD',
    status: 'paid',
    dueDate: '2026-02-15',
    paidAt: '2026-02-10',
  },
  {
    invoiceId: 'inv-003',
    invoiceNumber: 'INV-2025-12',
    period: 'December 2025',
    bookings: 25,
    totalAmount: 2100,
    currency: 'USD',
    status: 'paid',
    dueDate: '2026-01-15',
    paidAt: '2026-01-12',
  },
  {
    invoiceId: 'inv-004',
    invoiceNumber: 'INV-2025-11',
    period: 'November 2025',
    bookings: 18,
    totalAmount: 1500,
    currency: 'USD',
    status: 'paid',
    dueDate: '2025-12-15',
    paidAt: '2025-12-14',
  },
];

export default function Invoices() {
  const { status } = useSession();
  const router = useRouter();
  const [invoices] = useState<Invoice[]>(MOCK_INVOICES);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const downloadCSV = (invoice: Invoice) => {
    const rows = [
      [
        'Invoice Number',
        'Period',
        'Bookings',
        'Total Amount',
        'Status',
        'Due Date',
      ],
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
              ${unpaidTotal.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoices.filter((i) => i.status !== 'paid').length} invoice(s)
              pending
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Paid this year</p>
            <p className="text-3xl font-bold text-green-600 mt-1">
              ${paidTotal.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {invoices.filter((i) => i.status === 'paid').length} invoice(s)
            </p>
          </div>
          <div className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">Total bookings</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">
              {invoices.reduce((s, i) => s + i.bookings, 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">across all invoices</p>
          </div>
        </div>

        {/* Invoice list */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
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
                    ) : (
                      new Date(inv.dueDate).toLocaleDateString()
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
        </div>
      </div>
    </Layout>
  );
}
