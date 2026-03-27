'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OperatorInfo {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  roles: string[];
}

interface Reservation {
  id: string;
  guestName?: string;
  activityName?: string;
  date?: string;
  status?: string;
}

interface OperatorStats {
  totalEarningsMonth?: number;
  activeActivities?: number;
  avgRating?: number;
  reservationsMonth?: number;
}

function parseJwt(token: string): OperatorInfo | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const p = JSON.parse(atob(base64));
    return {
      id: p.sub || p.userId || '',
      firstName: p.firstName || p.name || 'Operador',
      lastName: p.lastName,
      email: p.email,
      roles: Array.isArray(p.roles) ? p.roles : [],
    };
  } catch { return null; }
}

const SIDEBAR_NAV = [
  { icon: '🏠', label: 'Inicio',          href: '/services/operadores', active: true },
  { icon: '🧗', label: 'Mis actividades', href: '/services/operadores/actividades' },
  { icon: '📅', label: 'Reservas',        href: '/services/operadores/reservas' },
  { icon: '💳', label: 'Ganancias',       href: '/services/operadores/ganancias' },
  { icon: '⭐', label: 'Reseñas',         href: '/services/operadores/resenas' },
  { icon: '📄', label: 'Documentos',      href: '/services/operadores/documentos' },
  { icon: '⚙️', label: 'Mi cuenta',       href: '/account' },
];

const DOCUMENTS = [
  { icon: '📄', label: 'Cédula de Identidad / RUC',                   note: 'Requerido' },
  { icon: '🏛️', label: 'Registro Ministerio de Turismo',              note: 'Requerido' },
  { icon: '🏢', label: 'Permiso de operadora de turismo (MINTUR)',     note: 'Requerido' },
  { icon: '🏙️', label: 'Patente municipal',                           note: 'Requerido' },
  { icon: '🔥', label: 'Permiso de funcionamiento (Bomberos)',         note: 'Requerido' },
  { icon: '🛡️', label: 'Póliza de responsabilidad civil',             note: 'Actividades de riesgo' },
];

export default function OperadoresPanel() {
  const [user, setUser] = useState<OperatorInfo | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<OperatorStats>({});
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { window.location.href = '/auth/login?from=/services/operadores'; return; }
    const decoded = parseJwt(token);
    if (!decoded) { window.location.href = '/auth/login'; return; }
    setUser(decoded);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${apiUrl}/experiences/operator/stats`, { headers })
      .then(r => r.ok ? r.json() : {})
      .then((d: OperatorStats) => setStats(d))
      .catch(() => {});

    fetch(`${apiUrl}/experiences/operator/reservations?limit=5`, { headers })
      .then(r => r.ok ? r.json() : [])
      .then((d: any) => {
        const list = Array.isArray(d) ? d : (d.data ?? []);
        setReservations(list.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    document.cookie = 'going_webapp_session=; path=/; max-age=0';
    window.location.href = '/';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#d97706' }} />
      </div>
    );
  }

  const initials = `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase();

  const KPIS = [
    { label: 'Ingresos este mes',     value: stats.totalEarningsMonth != null ? `$${stats.totalEarningsMonth}` : '—', icon: '💰', color: '#d97706', href: '/services/operadores/ganancias' },
    { label: 'Actividades activas',   value: stats.activeActivities   != null ? String(stats.activeActivities)   : '—', icon: '🧗', color: '#0033A0', href: '/services/operadores/actividades' },
    { label: 'Calificación',          value: stats.avgRating          != null ? `${stats.avgRating}★`            : '—', icon: '⭐', color: '#f59e0b', href: '/services/operadores/resenas' },
    { label: 'Reservas este mes',     value: stats.reservationsMonth  != null ? String(stats.reservationsMonth)  : '—', icon: '📅', color: '#16a34a', href: '/services/operadores/reservas' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200">☰</button>
            <Link href="/services/operadores">
              <span className="text-xl font-black" style={{ color: '#d97706' }}>🧗 Going Operadores</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* Disponibilidad toggle */}
            <button
              onClick={() => setActive(v => !v)}
              className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                active ? 'border-green-400 text-green-700 bg-green-50' : 'border-gray-300 text-gray-500 bg-gray-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
              {active ? 'Activo' : 'Inactivo'}
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-semibold text-gray-800">{user.firstName}</span>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">Salir</button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 max-w-screen-xl mx-auto w-full">

        {sidebarOpen && (
          <div className="fixed inset-0 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 z-20 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold"
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                {initials}
              </div>
              <div>
                <p className="font-bold text-gray-900">{user.firstName} {user.lastName ?? ''}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-white" style={{ backgroundColor: '#d97706' }}>Operador</span>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-2 overflow-y-auto">
            {SIDEBAR_NAV.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-colors ${
                  item.active ? 'text-white font-bold' : 'text-gray-600 hover:bg-gray-100'
                }`}
                style={item.active ? { backgroundColor: '#d97706' } : {}}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-100">
            <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 text-sm">
              🚪 Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="flex-1 min-w-0 px-4 lg:px-8 py-6 space-y-6">

          <div>
            <h1 className="text-2xl font-black text-gray-900">Hola, {user.firstName} 👋</h1>
            <p className="text-gray-400 text-sm mt-0.5">Gestiona tus actividades y aventuras</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KPIS.map(kpi => (
              <Link key={kpi.label} href={kpi.href}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer block">
                <p className="text-xs text-gray-400 font-semibold mb-1">{kpi.label}</p>
                <p className="text-3xl font-black" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-xl mt-1">{kpi.icon}</p>
              </Link>
            ))}
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '➕', label: 'Nueva actividad', href: '/services/operadores/actividades/nueva' },
              { icon: '📅', label: 'Ver reservas',    href: '/services/operadores/reservas' },
              { icon: '💳', label: 'Mis ganancias',   href: '/services/operadores/ganancias' },
              { icon: '⭐', label: 'Reseñas',         href: '/services/operadores/resenas' },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all text-center">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{a.label}</span>
              </Link>
            ))}
          </div>

          {/* Próximas reservas */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Próximas reservas</h3>
              <Link href="/services/operadores/reservas" className="text-xs font-bold" style={{ color: '#d97706' }}>Ver todas →</Link>
            </div>
            {reservations.length > 0 ? (
              <ul className="space-y-3">
                {reservations.map(r => (
                  <li key={r.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{r.guestName ?? 'Viajero'}</p>
                      <p className="text-xs text-gray-400">{r.activityName ?? '—'} · {r.date ?? '—'}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full font-semibold bg-amber-50 text-amber-700">{r.status ?? 'Confirmada'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🧗</p>
                <p className="text-gray-400 text-sm">Aún no tienes actividades publicadas.</p>
                <Link href="/services/operadores/actividades/nueva"
                  className="inline-block mt-3 text-sm font-bold underline" style={{ color: '#d97706' }}>
                  Crear mi primera actividad →
                </Link>
              </div>
            )}
          </div>

          {/* Documentos Ministerio de Turismo */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Documentos requeridos</h3>
              <Link href="/services/operadores/documentos" className="text-xs font-bold" style={{ color: '#d97706' }}>Gestionar →</Link>
            </div>
            <p className="text-xs text-gray-400 mb-4">Registro y permisos del Ministerio de Turismo del Ecuador</p>
            <ul className="space-y-2">
              {DOCUMENTS.map(doc => (
                <li key={doc.label} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{doc.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{doc.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{doc.note}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                      Pendiente
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </main>
      </div>
    </div>
  );
}
