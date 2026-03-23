'use client';

import EmpresasLayout from '../EmpresasLayout';
import { useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    companyName: 'Mi Empresa S.A.',
    ruc: '1234567890001',
    address: 'Av. Amazonas N25-123, Quito',
    phone: '+593 2 123 4567',
    billingEmail: 'facturacion@empresa.com',
    budgetAlert: '5000',
    requireApprovalAbove: '200',
    notifyEmail: true,
    notifyWhatsapp: false,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <EmpresasLayout>
      <div className="p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-500 mt-1 text-sm">Administra los datos y políticas de tu empresa</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Empresa */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Datos de la empresa</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Razón social', key: 'companyName', type: 'text' },
                { label: 'RUC',          key: 'ruc',         type: 'text' },
                { label: 'Dirección',    key: 'address',     type: 'text' },
                { label: 'Teléfono',     key: 'phone',       type: 'tel'  },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium text-gray-700 block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41]"
                  />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">Email de facturación</label>
                <input type="email" value={form.billingEmail} onChange={e => setForm(prev => ({ ...prev, billingEmail: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41]" />
              </div>
            </div>
          </div>

          {/* Políticas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Políticas de viaje</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Alerta de presupuesto mensual (USD)</label>
                <input type="number" value={form.budgetAlert} onChange={e => setForm(prev => ({ ...prev, budgetAlert: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41]" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Requerir aprobación sobre (USD)</label>
                <input type="number" value={form.requireApprovalAbove} onChange={e => setForm(prev => ({ ...prev, requireApprovalAbove: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4c41]" />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { key: 'notifyEmail',     label: 'Notificaciones por email'     },
                { key: 'notifyWhatsapp',  label: 'Notificaciones por WhatsApp'  },
              ].map(n => (
                <label key={n.key} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={(form as any)[n.key]} onChange={e => setForm(prev => ({ ...prev, [n.key]: e.target.checked }))}
                    className="w-4 h-4 rounded" style={{ accentColor: '#ff4c41' }} />
                  <span className="text-sm text-gray-700">{n.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button type="submit" className="px-6 py-3 text-white rounded-xl font-medium transition hover:opacity-90" style={{ backgroundColor: '#ff4c41' }}>
              Guardar cambios
            </button>
            {saved && <span className="text-sm text-green-600 font-medium">✓ Cambios guardados</span>}
          </div>
        </form>
      </div>
    </EmpresasLayout>
  );
}
