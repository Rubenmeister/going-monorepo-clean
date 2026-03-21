import Layout from '../components/Layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type ServiceType = 'transport' | 'accommodation' | 'tour' | 'experience';

interface ApprovalRequest {
  workflowId: string;
  bookingId: string;
  requester: { id: string; name: string; department: string };
  serviceType: ServiceType;
  totalPrice: { amount: number; currency: string };
  notes?: string;
  createdAt: string;
  urgency: 'low' | 'medium' | 'high';
}

const SERVICE_ICONS: Record<ServiceType, string> = {
  transport: '🚗',
  accommodation: '🏨',
  tour: '🗺️',
  experience: '🎭',
};

const URGENCY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const MOCK_PENDING: ApprovalRequest[] = [
  {
    workflowId: 'wf-001',
    bookingId: 'bk-004',
    requester: {
      id: 'emp-002',
      name: 'Ana Martínez',
      department: 'Engineering',
    },
    serviceType: 'accommodation',
    totalPrice: { amount: 120.0, currency: 'USD' },
    notes: 'Client meeting in Guayaquil, need hotel for 2 nights',
    createdAt: '2026-02-20T08:00:00Z',
    urgency: 'high',
  },
  {
    workflowId: 'wf-002',
    bookingId: 'bk-005',
    requester: { id: 'emp-003', name: 'Luis Pérez', department: 'Marketing' },
    serviceType: 'transport',
    totalPrice: { amount: 55.0, currency: 'USD' },
    notes: 'Trade show visit',
    createdAt: '2026-02-19T16:45:00Z',
    urgency: 'medium',
  },
  {
    workflowId: 'wf-003',
    bookingId: 'bk-006',
    requester: { id: 'emp-004', name: 'María Gómez', department: 'HR' },
    serviceType: 'experience',
    totalPrice: { amount: 200.0, currency: 'USD' },
    notes: 'Team building activity',
    createdAt: '2026-02-18T11:20:00Z',
    urgency: 'low',
  },
];

export default function Approvals() {
  const { status } = useSession();
  const router = useRouter();
  const [pending, setPending] = useState<ApprovalRequest[]>(MOCK_PENDING);
  const [processing, setProcessing] = useState<string | null>(null);
  const [history, setHistory] = useState<
    { workflowId: string; decision: 'approved' | 'rejected'; name: string }[]
  >([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const decide = (workflowId: string, decision: 'approved' | 'rejected') => {
    setProcessing(workflowId);
    setTimeout(() => {
      const req = pending.find((r) => r.workflowId === workflowId);
      if (req) {
        setHistory((prev) => [
          { workflowId, decision, name: req.requester.name },
          ...prev,
        ]);
      }
      setPending((prev) => prev.filter((r) => r.workflowId !== workflowId));
      setProcessing(null);
    }, 600);
  };

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
          <p className="text-gray-500 mt-1">
            Review and approve employee booking requests
          </p>
        </div>

        {/* Stats banner */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">
              {pending.length}
            </p>
            <p className="text-sm text-orange-700 mt-1">Pending review</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {history.filter((h) => h.decision === 'approved').length}
            </p>
            <p className="text-sm text-green-700 mt-1">Approved today</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-600">
              {history.filter((h) => h.decision === 'rejected').length}
            </p>
            <p className="text-sm text-red-700 mt-1">Rejected today</p>
          </div>
        </div>

        {/* Pending approvals */}
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Pending Requests
        </h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-12 text-center text-gray-400">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-medium">All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {pending.map((req) => (
              <div
                key={req.workflowId}
                className="bg-white rounded-xl shadow p-5 flex flex-col md:flex-row md:items-center gap-4"
              >
                {/* Left: employee & service info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                      {req.requester.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {req.requester.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {req.requester.department}
                      </p>
                    </div>
                    <span
                      className={`ml-auto md:ml-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                        URGENCY_COLORS[req.urgency]
                      }`}
                    >
                      {req.urgency} priority
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                    <span>{SERVICE_ICONS[req.serviceType]}</span>
                    <span className="capitalize font-medium">
                      {req.serviceType}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-semibold text-gray-900">
                      ${req.totalPrice.amount.toFixed(2)}
                    </span>
                  </div>
                  {req.notes && (
                    <p className="text-sm text-gray-500 mt-2 italic">
                      "{req.notes}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Requested {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Right: action buttons */}
                <div className="flex gap-2 md:flex-col lg:flex-row">
                  <button
                    onClick={() => decide(req.workflowId, 'rejected')}
                    disabled={processing === req.workflowId}
                    className="flex-1 md:flex-none px-5 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => decide(req.workflowId, 'approved')}
                    disabled={processing === req.workflowId}
                    className="flex-1 md:flex-none px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {processing === req.workflowId ? 'Processing…' : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent decisions */}
        {history.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Recent Decisions
            </h2>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <ul className="divide-y divide-gray-100">
                {history.map((h, i) => (
                  <li key={i} className="px-5 py-3 flex items-center gap-3">
                    <span>{h.decision === 'approved' ? '✅' : '❌'}</span>
                    <span className="text-gray-700 text-sm flex-1">
                      <span className="font-medium">{h.name}</span> —{' '}
                      <span
                        className={
                          h.decision === 'approved'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }
                      >
                        {h.decision}
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">just now</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
