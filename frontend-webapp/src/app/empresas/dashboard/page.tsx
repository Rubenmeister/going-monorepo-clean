'use client';

import EmpresasLayout from '../EmpresasLayout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const STATS = [
  { label: 'Reservas pendientes', value: '3',     sub: 'Por aprobar',      icon: '📋', color: '#F59E0B' },
  { label: 'Miembros del equipo', value: '24',    sub: 'Usuarios activos', icon: '👥', color: '#22C55E' },
  { label: 'Gasto mensual',       value: '$2,840', sub: 'Marzo 2026',       icon: '💳', color: '#ff4c41' },
  { label: 'Viajes activos',      value: '5',     sub: 'En progreso',      icon: '✈️', color: '#0ea5e9' },
];

const QUICK_ACTIONS = [
  { label: 'Nueva Reserva',        icon: '➕', href: '/empresas/bookings',  color: '#ff4c41' },
  { label: 'Aprobar Solicitudes',  icon: '✅', href: '/empresas/approvals', color: '#22C55E' },
  { label: 'Ver Seguimiento',      icon: '📍', href: '/empresas/tracking',  color: '#0ea5e9' },
  { label: 'Descargar Reporte',    icon: '📊', href: '/empresas/reports',   color: '#8B5CF6' },
];

const RECENT_ACTIVITY = [
  { icon: '🚗', title: 'Reserva de transporte confirmada',     sub: 'Carlos Rodríguez · Quito → Guayaquil',  time: 'Hace 30 min', status: 'confirmed' },
  { icon: '✅', title: 'Solicitud de aprobación pendiente',    sub: 'Ana Martínez · Hotel Guayaquil 2 noches', time: 'Hace 2 horas', status: 'pending' },
  { icon: '🏨', title: 'Check-in completado',                  sub: 'Luis Pérez · Casa Gangotena, Quito',     time: 'Hace 4 horas', status: 'completed' },
  { icon: '💳', title: 'Pago procesado',                       sub: 'Factura INV-2026-01 · $980 USD',         time: 'Ayer',         status: 'completed' },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#22C55E',
  pending:   '#F59E0B',
  completed: '#6b7280',
};

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('Administrador');
  const [companyName, setCompanyName] = useState('Tu Empresa');

  useEffect(() => {
    const token = localStorage.getItem('empresasToken') || localStorage.getItem('authToken');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const name = [payload.firstName, payload.lastName].filter(Boolean).join(' ') || payload.email?.split('@')[0] || 'Administrador';
      setUserName(name);
      if (payload.email) setCompanyName(payload.email.split('@')[1]?.split('.')[0] || 'Tu Empresa');
    } catch { /* ignore */ }
  }, []);

  return (
    <EmpresasLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {userName} 👋</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Panel corporativo de <span className="font-semibold capitalize">{companyName}</span> — Marzo 2026
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${s.color}18` }}>
                  {s.icon}
                </div>
              </div>
              <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">{s.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Acciones rápidas</h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => router.push(a.href)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: a.color }}
                >
                  <span>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Actividad reciente</h2>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="text-2xl flex-shrink-0 mt-0.5">{a.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{a.sub}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="w-2 h-2 rounded-full mb-1 ml-auto" style={{ backgroundColor: STATUS_COLORS[a.status] }} />
                    <p className="text-xs text-gray-400 whitespace-nowrap">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmpresasLayout>
  );
}
