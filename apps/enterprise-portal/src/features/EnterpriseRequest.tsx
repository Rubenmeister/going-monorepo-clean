import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnterpriseLayout } from '../components/EnterpriseLayout';

interface EnterpriseRequestProps {
  type?: 'ride' | 'shipment';
}

const COST_CENTERS = [
  { id: 'gerencia', name: 'Gerencia General' },
  { id: 'ventas', name: 'Ventas' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'operaciones', name: 'Operaciones' },
  { id: 'ti', name: 'Tecnología' },
];

const TRAVEL_PURPOSES = [
  'Reunión con cliente',
  'Reunión interna',
  'Visita a proveedor',
  'Evento corporativo',
  'Traslado aeropuerto',
  'Otro',
];

export function EnterpriseRequest({ type }: EnterpriseRequestProps) {
  const navigate = useNavigate();
  const [requestType, setRequestType] = useState(type || 'ride');
  const [form, setForm] = useState({
    from: '',
    to: '',
    date: '',
    time: '',
    costCenter: '',
    purpose: '',
    passengers: 1,
    forOther: false,
    passengerName: '',
    passengerEmail: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Solicitud exitosa`);
    navigate(requestType === 'ride' ? '/trips' : '/shipments');
  };

  return (
    <EnterpriseLayout activeItem={requestType === 'ride' ? 'trips' : 'shipments'}>
      {/* Header */}
      <header className="top-header">
        <h1 className="page-title">
          {requestType === 'ride' ? 'Solicitar Viaje' : 'Solicitar Envío'}
        </h1>
      </header>

      {/* Content */}
      <div className="page-content">
        <div className="max-w-2xl mx-auto">
          {/* Form */}
          <form onSubmit={handleSubmit} className="data-card overflow-hidden">
            <div className="card-header bg-slate-50 border-b border-slate-200">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setRequestType('ride')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${requestType === 'ride' ? 'bg-enterprise-blue text-white' : 'hover:bg-slate-200'}`}
                >
                  🚗 Viaje
                </button>
                <button 
                  type="button"
                  onClick={() => setRequestType('shipment')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition ${requestType === 'shipment' ? 'bg-enterprise-blue text-white' : 'hover:bg-slate-200'}`}
                >
                  📦 Envío
                </button>
              </div>
            </div>

            <div className="card-body space-y-6">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Origen</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Punto de partida"
                    value={form.from}
                    onChange={(e) => setForm({ ...form, from: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destino</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Punto de llegada"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input type="date" className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input type="time" className="form-input" required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Centro de Costo</label>
                  <select className="form-input" required>
                    <option value="">Seleccionar...</option>
                    {COST_CENTERS.map(cc => <option key={cc.id} value={cc.id}>{cc.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo</label>
                  <select className="form-input" required>
                    <option value="">Seleccionar...</option>
                    {TRAVEL_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    onChange={(e) => setForm({...form, forOther: e.target.checked})}
                    className="w-4 h-4 text-enterprise-blue"
                  />
                  <span className="text-sm font-medium">Este servicio es para otra persona</span>
                </label>
              </div>

              {form.forOther && (
                <div className="grid-2 p-4 bg-slate-50 rounded-lg animate-fadeIn">
                  <div className="form-group">
                    <label className="form-label">Nombre Pasajero</label>
                    <input type="text" className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Pasajero</label>
                    <input type="email" className="form-input" />
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Crear Solicitud
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </EnterpriseLayout>
  );
}

export default EnterpriseRequest;
