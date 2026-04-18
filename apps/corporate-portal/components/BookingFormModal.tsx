'use client';
import { useState } from 'react';

type ServiceType = 'transport' | 'tour' | 'experience' | 'accommodation';
type VehicleType = 'sedan' | 'suv' | 'van' | 'minibus';
type PaymentMethod = 'corporate_card' | 'invoice_30' | 'cash_transfer' | 'agency_invoice';
type BookingMode = 'direct' | 'approval';

export interface BookingPayload {
  mode: BookingMode;
  serviceType: ServiceType;
  requesterName: string;
  department: string;
  paymentMethod: PaymentMethod;
  notes: string;
  estimatedAmount: number;
  // Transport
  origin?: string;
  destination?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  passengers?: number;
  vehicleType?: VehicleType;
  roundTrip?: boolean;
  // Tour
  tourName?: string;
  tourGroupSize?: number;
  tourDate?: string;
  tourDuration?: string;
  // Experience
  experienceType?: string;
  experienceDate?: string;
  experienceTime?: string;
  experienceParticipants?: number;
  // Accommodation
  city?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  guests?: number;
}

interface Props {
  onClose: () => void;
  onSubmit: (data: BookingPayload) => void;
}

const SERVICES: { key: ServiceType; label: string; icon: string; desc: string }[] = [
  { key: 'transport',     label: 'Transporte',    icon: '🚗', desc: 'Traslados, aeropuerto, ejecutivo' },
  { key: 'tour',          label: 'Tours',         icon: '🗺️', desc: 'Tours y excursiones grupales' },
  { key: 'experience',    label: 'Experiencias',  icon: '🎭', desc: 'Actividades y eventos corporativos' },
  { key: 'accommodation', label: 'Alojamiento',   icon: '🏨', desc: 'Hospedaje para viajeros corporativos' },
];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { key: 'corporate_card',   label: 'Tarjeta corporativa',  icon: '💳', desc: 'Cargo inmediato a la cuenta empresarial' },
  { key: 'invoice_30',       label: 'Factura a 30 días',    icon: '🧾', desc: 'Crédito mensual consolidado' },
  { key: 'cash_transfer',    label: 'Transferencia/contado',icon: '🏦', desc: 'Pago inmediato — mejores tarifas' },
  { key: 'agency_invoice',   label: 'Factura agencia',      icon: '✈️', desc: 'Para agencias de viajes autorizadas' },
];

const VEHICLES: { key: VehicleType; label: string; cap: string }[] = [
  { key: 'sedan',   label: 'Sedán',    cap: '1–4 pax' },
  { key: 'suv',     label: 'SUV',      cap: '1–6 pax' },
  { key: 'van',     label: 'Van',      cap: '7–12 pax' },
  { key: 'minibus', label: 'Minibús',  cap: '13–20 pax' },
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent bg-white placeholder:text-gray-400';
const SELECT = INPUT + ' cursor-pointer';

export default function BookingFormModal({ onClose, onSubmit }: Props) {
  const [mode, setMode] = useState('direct' as BookingMode);
  const [service, setService] = useState('transport' as ServiceType);
  const [payment, setPayment] = useState('corporate_card' as PaymentMethod);
  const [requesterName, setRequesterName] = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');

  // Transport fields
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [passengers, setPassengers] = useState('1');
  const [vehicleType, setVehicleType] = useState('sedan' as VehicleType);
  const [roundTrip, setRoundTrip] = useState(false);

  // Tour fields
  const [tourName, setTourName] = useState('');
  const [tourGroupSize, setTourGroupSize] = useState('');
  const [tourDate, setTourDate] = useState('');
  const [tourDuration, setTourDuration] = useState('');

  // Experience fields
  const [experienceType, setExperienceType] = useState('');
  const [experienceDate, setExperienceDate] = useState('');
  const [experienceTime, setExperienceTime] = useState('');
  const [experienceParticipants, setExperienceParticipants] = useState('');

  // Accommodation fields
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState('1');
  const [guests, setGuests] = useState('1');

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BookingPayload = {
      mode,
      serviceType: service,
      requesterName: requesterName.trim(),
      department: department.trim(),
      paymentMethod: payment,
      notes: notes.trim(),
      estimatedAmount: parseFloat(estimatedAmount) || 0,
      ...(service === 'transport' && {
        origin, destination, scheduledDate, scheduledTime,
        passengers: parseInt(passengers) || 1,
        vehicleType, roundTrip,
      }),
      ...(service === 'tour' && {
        tourName, tourGroupSize: parseInt(tourGroupSize) || 1,
        tourDate, tourDuration,
      }),
      ...(service === 'experience' && {
        experienceType, experienceDate, experienceTime,
        experienceParticipants: parseInt(experienceParticipants) || 1,
      }),
      ...(service === 'accommodation' && {
        city, checkIn, checkOut,
        rooms: parseInt(rooms) || 1,
        guests: parseInt(guests) || 1,
      }),
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Nueva Reserva Corporativa</h2>
            <p className="text-xs text-gray-400 mt-0.5">Portal Going Empresas · Tarifa B2B</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition text-xl leading-none">
            ×
          </button>
        </div>

        {/* Mode toggle */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {([
            { key: 'direct',   label: '👤 Manager reserva directamente' },
            { key: 'approval', label: '⏳ Empleado solicita aprobación' },
          ] as { key: BookingMode; label: string }[]).map(m => (
            <button key={m.key} type="button" onClick={() => setMode(m.key)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${mode === m.key ? 'text-[#ff4c41] border-b-2 border-[#ff4c41] bg-red-50' : 'text-gray-500 hover:text-gray-700'}`}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <form id="booking-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Service type */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Tipo de servicio <span className="text-red-400">*</span></p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map(s => (
                <button key={s.key} type="button" onClick={() => setService(s.key)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${service === s.key ? 'border-[#ff4c41] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-2xl flex-shrink-0">{s.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${service === s.key ? 'text-[#ff4c41]' : 'text-gray-800'}`}>{s.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Requester info */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre del solicitante" required>
              <input className={INPUT} value={requesterName} onChange={e => setRequesterName(e.target.value)}
                placeholder={mode === 'direct' ? 'Nombre del empleado' : 'Tu nombre completo'} required />
            </Field>
            <Field label="Departamento">
              <input className={INPUT} value={department} onChange={e => setDepartment(e.target.value)} placeholder="Ej: Ventas, RRHH..." />
            </Field>
          </div>

          {/* ── TRANSPORT ── */}
          {service === 'transport' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Origen" required>
                  <input className={INPUT} value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Dirección de recogida" required />
                </Field>
                <Field label="Destino" required>
                  <input className={INPUT} value={destination} onChange={e => setDestination(e.target.value)} placeholder="Dirección de llegada" required />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha" required>
                  <input type="date" className={INPUT} value={scheduledDate} min={today} onChange={e => setScheduledDate(e.target.value)} required />
                </Field>
                <Field label="Hora de recogida" required>
                  <input type="time" className={INPUT} value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} required />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Pasajeros">
                  <input type="number" min="1" max="50" className={INPUT} value={passengers} onChange={e => setPassengers(e.target.value)} />
                </Field>
                <Field label="Tipo de vehículo">
                  <select className={SELECT} value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)}>
                    {VEHICLES.map(v => <option key={v.key} value={v.key}>{v.label} ({v.cap})</option>)}
                  </select>
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={roundTrip} onChange={e => setRoundTrip(e.target.checked)} className="w-4 h-4 accent-[#ff4c41]" />
                <span className="text-sm text-gray-700 font-medium">Incluir viaje de regreso (ida y vuelta)</span>
              </label>
            </>
          )}

          {/* ── TOUR ── */}
          {service === 'tour' && (
            <>
              <Field label="Nombre / destino del tour" required>
                <input className={INPUT} value={tourName} onChange={e => setTourName(e.target.value)} placeholder="Ej: Tour al Cotopaxi, City Tour Quito…" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha del tour" required>
                  <input type="date" className={INPUT} value={tourDate} min={today} onChange={e => setTourDate(e.target.value)} required />
                </Field>
                <Field label="Nº de participantes" required>
                  <input type="number" min="1" className={INPUT} value={tourGroupSize} onChange={e => setTourGroupSize(e.target.value)} placeholder="Ej: 12" required />
                </Field>
              </div>
              <Field label="Duración estimada">
                <select className={SELECT} value={tourDuration} onChange={e => setTourDuration(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  <option value="half_day">Medio día (4h)</option>
                  <option value="full_day">Día completo (8h)</option>
                  <option value="2_days">2 días / 1 noche</option>
                  <option value="3_days">3 días / 2 noches</option>
                  <option value="custom">Personalizado</option>
                </select>
              </Field>
            </>
          )}

          {/* ── EXPERIENCE ── */}
          {service === 'experience' && (
            <>
              <Field label="Tipo de experiencia" required>
                <select className={SELECT} value={experienceType} onChange={e => setExperienceType(e.target.value)} required>
                  <option value="">Seleccionar tipo…</option>
                  <option value="teambuilding">Team Building</option>
                  <option value="dinner_gala">Cena / Gala corporativa</option>
                  <option value="adventure">Aventura al aire libre</option>
                  <option value="cultural">Experiencia cultural</option>
                  <option value="wellness">Bienestar / Wellness</option>
                  <option value="custom">Personalizada</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha" required>
                  <input type="date" className={INPUT} value={experienceDate} min={today} onChange={e => setExperienceDate(e.target.value)} required />
                </Field>
                <Field label="Hora de inicio">
                  <input type="time" className={INPUT} value={experienceTime} onChange={e => setExperienceTime(e.target.value)} />
                </Field>
              </div>
              <Field label="Nº de participantes" required>
                <input type="number" min="1" className={INPUT} value={experienceParticipants} onChange={e => setExperienceParticipants(e.target.value)} placeholder="Ej: 30" required />
              </Field>
            </>
          )}

          {/* ── ACCOMMODATION ── */}
          {service === 'accommodation' && (
            <>
              <Field label="Ciudad / destino" required>
                <input className={INPUT} value={city} onChange={e => setCity(e.target.value)} placeholder="Ej: Cuenca, Galápagos, Guayaquil…" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Check-in" required>
                  <input type="date" className={INPUT} value={checkIn} min={today} onChange={e => setCheckIn(e.target.value)} required />
                </Field>
                <Field label="Check-out" required>
                  <input type="date" className={INPUT} value={checkOut} min={checkIn || today} onChange={e => setCheckOut(e.target.value)} required />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Habitaciones">
                  <input type="number" min="1" className={INPUT} value={rooms} onChange={e => setRooms(e.target.value)} />
                </Field>
                <Field label="Huéspedes totales">
                  <input type="number" min="1" className={INPUT} value={guests} onChange={e => setGuests(e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* Payment method */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Método de pago <span className="text-red-400">*</span></p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map(p => (
                <button key={p.key} type="button" onClick={() => setPayment(p.key)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition ${payment === p.key ? 'border-[#ff4c41] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-lg flex-shrink-0">{p.icon}</span>
                  <div>
                    <p className={`text-xs font-semibold leading-tight ${payment === p.key ? 'text-[#ff4c41]' : 'text-gray-800'}`}>{p.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Estimated amount + notes */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monto estimado (USD)">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                <input type="number" min="0" step="0.01" className={INPUT + ' pl-7'} value={estimatedAmount}
                  onChange={e => setEstimatedAmount(e.target.value)} placeholder="0.00" />
              </div>
            </Field>
            <div className="flex items-end">
              <div className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 w-full">
                💡 Tarifas corporativas Going incluyen IVA y cargo por servicio B2B
              </div>
            </div>
          </div>

          <Field label="Notas adicionales">
            <textarea rows={2} className={INPUT + ' resize-none'} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Motivo del viaje, requerimientos especiales, preferencias…" />
          </Field>

          {mode === 'approval' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 font-medium">
              ⏳ Esta solicitud será enviada a tu manager para aprobación. Se confirmará una vez autorizada.
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition">
            Cancelar
          </button>
          <button type="submit" form="booking-form"
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#ff4c41' }}>
            {mode === 'direct' ? '✓ Confirmar reserva' : '⏳ Enviar para aprobación'}
          </button>
        </div>
      </div>
    </div>
  );
}
