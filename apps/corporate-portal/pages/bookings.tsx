import Layout from '../components/Layout';
import BookingFormModal from '../components/BookingFormModal';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

type ServiceType = 'transport' | 'accommodation' | 'tour' | 'experience';
type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface Booking {
  bookingId: string;
  serviceType: ServiceType;
  assignedTo: string;
  totalPrice: { amount: number; currency: string };
  approvalStatus: ApprovalStatus;
  status: BookingStatus;
  createdAt: string;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const APPROVAL_COLORS: Record<ApprovalStatus, string> = {
  pending: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const SERVICE_ICONS: Record<ServiceType, string> = {
  transport: '🚗',
  accommodation: '🏨',
  tour: '🗺️',
  experience: '🎭',
};

const MOCK_BOOKINGS: Booking[] = [
  {
    bookingId: 'bk-001',
    serviceType: 'transport',
    assignedTo: 'Carlos Rodríguez',
    totalPrice: { amount: 45.0, currency: 'USD' },
    approvalStatus: 'approved',
    status: 'confirmed',
    createdAt: '2026-02-18T09:00:00Z',
  },
  {
    bookingId: 'bk-002',
    serviceType: 'accommodation',
    assignedTo: 'Ana Martínez',
    totalPrice: { amount: 120.0, currency: 'USD' },
    approvalStatus: 'pending',
    status: 'pending',
    createdAt: '2026-02-19T14:30:00Z',
  },
  {
    bookingId: 'bk-003',
    serviceType: 'tour',
    assignedTo: 'Luis Pérez',
    totalPrice: { amount: 75.0, currency: 'USD' },
    approvalStatus: 'approved',
    status: 'completed',
    createdAt: '2026-02-15T11:00:00Z',
  },
];

export default function Bookings() {
  const { status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const filtered = bookings.filter((b) => {
    const byStatus = filterStatus === 'all' || b.status === filterStatus;
    const byType = filterType === 'all' || b.serviceType === filterType;
    return byStatus && byType;
  });

  const handleNewBooking = (booking: Partial<Booking>) => {
    const newBooking: Booking = {
      bookingId: `bk-${Date.now()}`,
      serviceType: booking.serviceType || 'transport',
      assignedTo: booking.assignedTo || '',
      totalPrice: booking.totalPrice || { amount: 0, currency: 'USD' },
      approvalStatus: 'pending',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [newBooking, ...prev]);
    setShowModal(false);
  };

  if (status === 'loading') return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-500 mt-1">
              Manage travel bookings for your team
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <span className="text-lg">+</span> New Booking
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['all', 'pending', 'confirmed', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg p-4 text-left transition border-2 ${
                filterStatus === s
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-transparent bg-white shadow'
              }`}
            >
              <p className="text-sm text-gray-500 capitalize">
                {s === 'all' ? 'Total' : s}
              </p>
              <p className="text-2xl font-bold mt-1">
                {s === 'all'
                  ? bookings.length
                  : bookings.filter((b) => b.status === s).length}
              </p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex flex-wrap gap-4">
          <div>
            <label className="text-sm text-gray-600 font-medium mr-2">
              Service type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All types</option>
              <option value="transport">Transport</option>
              <option value="accommodation">Accommodation</option>
              <option value="tour">Tour</option>
              <option value="experience">Experience</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 font-medium mr-2">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Traveller
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Approval
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No bookings found
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <span className="mr-2">
                        {SERVICE_ICONS[b.serviceType]}
                      </span>
                      <span className="capitalize font-medium text-gray-700">
                        {b.serviceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{b.assignedTo}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      ${b.totalPrice.amount.toFixed(2)}{' '}
                      <span className="text-gray-400 text-xs">
                        {b.totalPrice.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          APPROVAL_COLORS[b.approvalStatus]
                        }`}
                      >
                        {b.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          STATUS_COLORS[b.status]
                        }`}
                      >
                        {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <BookingFormModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewBooking}
        />
      )}
    </Layout>
  );
}
