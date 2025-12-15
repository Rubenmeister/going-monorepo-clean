'use client';

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnterpriseAuth } from '../app/EnterpriseAuthContext';

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
  const { user, tenantName } = useEnterpriseAuth();
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
    // In production, this would call the API
    alert(`Solicitud ${requestType === 'ride' ? 'de viaje' : 'de envío'} creada exitosamente`);
    navigate(requestType === 'ride' ? '/e/trips' : '/e/shipments');
  };

  return (
    <>
      {/* Header */}
      <header className="top-header">
        <div>
          <h1 className="page-title">
            {requestType === 'ride' ? 'Solicitar Viaje' : 'Solicitar Envío'}
          </h1>
          <p className="text-sm text-muted">{tenantName}</p>
        </div>
      </header>

      {/* Content */}
      <div className="page-content">
        <div className="max-w-2xl">
          {/* Type Selector */}
          {!type && (
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setRequestType('ride')}
                className={`flex-1 p-4 rounded-xl border-2 transition ${
                  requestType === 'ride' 
                    ? 'border-enterprise-blue bg-enterprise-blue/5' 
                    : 'border-slate-200'
                }`}
              >
                <span className="text-2xl block mb-2">🚗</span>
                <span className="font-medium">Viaje</span>
              </button>
              <button
                onClick={() => setRequestType('shipment')}
                className={`flex-1 p-4 rounded-xl border-2 transition ${
                  requestType === 'shipment' 
                    ? 'border-enterprise-blue bg-enterprise-blue/5' 
                    : 'border-slate-200'
                }`}
              >
                <span className="text-2xl block mb-2">📦</span>
                <span className="font-medium">Envío</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="data-card">
            <div className="card-body space-y-6">
              {/* Route */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Origen</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Dirección de recogida"
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
                    placeholder="Dirección de destino"
                    value={form.to}
                    onChange={(e) => setForm({ ...form, to: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Fecha</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora</label>
                  <input
                    type="time"
                    className="form-input"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Enterprise Fields */}
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Centro de Costo</label>
                  <select
                    className="form-input"
                    value={form.costCenter}
                    onChange={(e) => setForm({ ...form, costCenter: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {COST_CENTERS.map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Motivo del viaje</label>
                  <select
                    className="form-input"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {TRAVEL_PURPOSES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* For Another Person */}
              {requestType === 'ride' && (
                <div className="border-t border-slate-200 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.forOther}
                      onChange={(e) => setForm({ ...form, forOther: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300"
                    />
                    <span className="font-medium">Este viaje es para otra persona</span>
                  </label>

                  {form.forOther && (
                    <div className="grid-2 mt-4">
                      <div className="form-group">
                        <label className="form-label">Nombre del pasajero</label>
                        <input
                          type="text"
                          className="form-input"
                          value={form.passengerName}
                          onChange={(e) => setForm({ ...form, passengerName: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email del pasajero</label>
                        <input
                          type="email"
                          className="form-input"
                          value={form.passengerEmail}
                          onChange={(e) => setForm({ ...form, passengerEmail: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Notas adicionales</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Instrucciones especiales, referencias, etc."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Submit */}
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-secondary"
                >
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
    </>
  );
}

export default EnterpriseRequest;
