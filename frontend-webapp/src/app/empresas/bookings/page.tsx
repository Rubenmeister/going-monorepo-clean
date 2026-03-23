'use client';

import EmpresasLayout from '../EmpresasLayout';
import { useState } from 'react';

type ServiceType = 'transport' | 'accommodation' | 'tour' | 'experience';
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
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
  pending:    'bg-yellow-100 text-yellow-800',
  confirmed:  'bg-blue-100 text-blue-800',
  in_progress:'bg-purple-100 text-purple-800',
  completed:  'bg-green-100 text-green-800',
  cancelled:  'bg-red-100 text-red-800',
};

const APPROVAL_COLORS: Record<ApprovalStatus, string> = {
  pending:   'bg-orange-100 text-orange-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const SERVICE_ICONS: Record<ServiceType, string> = {
  transport: '🚗', accommodation: '🏨', tour: '🗺️', experience: '🎭',
};

const MOCK_BOOKINGS: Booking[] = [
  { bookingId: 'bk-001', serviceType: 'transport',    assignedTo: 'Carlos Rodríguez', totalPrice: { amount: 45,  currency: 'USD' }, approvalStatus: 'approved', status: 'confirmed', createdAt: '2026-03-18T09:00:00Z' },
  { bookingId: 'bk-002', serviceType: 'accommodation', assignedTo: 'Ana Martínez',    totalPrice: { amount: 120, currency: 'USD' }, approvalStatus: 'pending',  status: 'pending',   createdAt: '2026-03-19T14:30:00Z' },
  { bookingId: 'bk-003', serviceType: 'tour',          assignedTo: 'Luis Pérez',      totalPrice: { amount: 75,  currency: 'USD' }, approvalStatus: 'approved', status: 'completed', createdAt: '2026-03-15T11:00:00Z' },
];

export default function BookingsPage() {
  const [bookings, setBookings]     = useState<Booking[]>(MOCK_BOOKINGS);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType]     = useState<string>('all');
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm] = useState({ serviceType: 'transport', assignedTo: '', amount: '', currency: 'USD' });

  const filtered = bookings.filter(b =>
    (filterStatus === 'all' || b.status === filterStatus) &&
    (filterType   === 'all' || b.serviceType === filterType)
  );

  const handleNew = (e: React.FormEvent) => {
    e.preventDefault();
    setBookings(prev => [{
      bookingId:     `bk-${Date.now()}`,
      serviceType:   form.serviceType as ServiceType,
      assignedTo:    form.assignedTo,
      totalPrice:    { amount: parseFloat(form.amount) || 0, currency: form.currency },
      approvalStatus:'pending',
      status:        'pending',
      createdAt:     new Date().toISOString(),
    }, ...prev]);
    setShowModal(false);
    setForm({ serviceType: 'transport', assignedTo: '', amount: '', currency: 'USD' });
  };

  return (
    <EmpresasLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
            <p className="text-gray-500 mt-1 text-sm">Gestiona los viajes del equipo</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-medium hover:opacity-90 transition" style={{ backgroundColor: '#ff4c41' }}>
            <span>➕</span> Nueva Reserva
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['all', 'pending', 'confirmed', 'completed'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`rounded-2xl p-4 text-left transition border-2 bg-white shadow-sm ${filterStatus === s ? 'border-[#ff4c41]' : 'border-transparent'}`}>
              <p className="text-sm text-gray-500 capitalize">{s === 'all' ? 'Total' : s.replace('_', ' ')}</p>
              <p className="text-2xl font-bold mt-1">{s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap gap-4">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Todos los servicios</option>
            <option value="transport">Transporte</option>
            <option value="accommodation">Alojamiento</option>
            <option value="tour">Tour</option>
            <option value="experience">Experiencia</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="in_progress">En progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Servicio', 'Viajero', 'Monto', 'Aprobación', 'Estado', 'Fecha'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">No se encontraron reservas</td></tr>
              ) : filtered.map(b => (
                <tr key={b.bookingId} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4"><span className="mr-2">{SERVICE_ICONS[b.serviceType]}</span><span className="capitalize font-medium text-gray-700">{b.serviceType}</span></td>
                  <td className="px-6 py-4 text-gray-700">{b.assignedTo}</td>
                  <td className="px-6 py-4 font-semibold">${b.totalPrice.amount.toFixed(2)} <span className="text-gray-400 text-xs">{b.totalPrice.currency}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${APPROVAL_COLORS[b.approvalStatus]}`}>{b.approvalStatus}</span></td>
                  <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[b.status]}`}>{b.status.replace('_', ' ')}</span></td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(b.createdAt).toLocaleDateString('es-EC')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold mb-4">Nueva Reserva</h2>
              <form onSubmit={handleNew} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Tipo de servicio</label>
                  <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                    <option value="transport">🚗 Transporte</option>
                    <option value="accommodation">🏨 Alojamiento</option>
                    <option value="tour">🗺️ Tour</option>
                    <option value="experience">🎭 Experiencia</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Asignar a</label>
                  <input required value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Nombre del colaborador" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Monto (USD)</label>
                  <input required type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium" style={{ backgroundColor: '#ff4c41' }}>Crear Reserva</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EmpresasLayout>
  );
}
