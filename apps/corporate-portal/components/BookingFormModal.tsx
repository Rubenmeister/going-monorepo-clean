import { useState } from 'react';

type ServiceType = 'transport' | 'accommodation' | 'tour' | 'experience';

interface Props {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const MOCK_EMPLOYEES = [
  { id: 'emp-001', name: 'Carlos Rodríguez', department: 'Sales' },
  { id: 'emp-002', name: 'Ana Martínez', department: 'Engineering' },
  { id: 'emp-003', name: 'Luis Pérez', department: 'Marketing' },
  { id: 'emp-004', name: 'María Gómez', department: 'HR' },
];

export default function BookingFormModal({ onClose, onSubmit }: Props) {
  const [mode, setMode] = useState<'manager' | 'employee'>('manager');
  const [serviceType, setServiceType] = useState<ServiceType>('transport');
  const [assignedTo, setAssignedTo] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('corporate_credit');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = MOCK_EMPLOYEES.find((e) => e.id === assignedTo);
    onSubmit({
      serviceType,
      assignedTo: emp?.name || '',
      totalPrice: { amount: parseFloat(amount) || 0, currency: 'USD' },
      paymentMethod,
      notes,
      mode,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <h2 className="text-xl font-bold text-gray-900">New Booking</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setMode('manager')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              mode === 'manager'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Manager books for employee
          </button>
          <button
            onClick={() => setMode('employee')}
            className={`flex-1 py-3 text-sm font-medium transition ${
              mode === 'employee'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Employee request (needs approval)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Service type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  'transport',
                  'accommodation',
                  'tour',
                  'experience',
                ] as ServiceType[]
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setServiceType(t)}
                  className={`py-2 rounded-lg border text-sm font-medium capitalize transition ${
                    serviceType === t
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned employee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'manager'
                ? 'Book for employee'
                : 'Traveller (yourself)'}
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select employee...</option>
              {MOCK_EMPLOYEES.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} — {emp.department}
                </option>
              ))}
            </select>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="corporate_credit">Corporate Credit</option>
              <option value="invoice">Invoice (end of month)</option>
              <option value="personal_card">
                Personal Card (reimbursement)
              </option>
            </select>
          </div>

          {/* Estimated amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated amount (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Purpose of travel, special requirements..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {mode === 'employee' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
              This booking will be sent to your manager for approval before
              confirmation.
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              {mode === 'manager' ? 'Confirm Booking' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
