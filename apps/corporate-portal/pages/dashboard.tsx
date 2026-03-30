import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { corpFetch } from '../lib/api';

interface DashStats {
  pendingBookings: number;
  teamMembers: number;
  monthlySpend: number;
  activeTrips: number;
}

interface RecentActivity {
  id: string;
  employee: string;
  action: string;
  time: string;
  amount?: number;
  status: string;
}

const QUICK_ACTIONS = [
  { label: 'Nueva Reserva',     icon: '➕', href: '/bookings' },
  { label: 'Ver Aprobaciones',  icon: '✅', href: '/approvals' },
  { label: 'Facturas',          icon: '🧾', href: '/invoices' },
  { label: 'Reportes',          icon: '📊', href: '/reports' },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.allSettled([
        corpFetch<any>('/corporate/stats', session.accessToken as string),
        corpFetch<any>('/corporate/bookings?limit=5', session.accessToken as string),
      ]);

      const s = statsRes.status === 'fulfilled' ? statsRes.value : null;
      setStats({
        pendingBookings: s?.pendingBookings ?? s?.pending ?? 0,
        teamMembers: s?.teamMembers ?? s?.employees ?? 0,
        monthlySpend: s?.monthlySpend ?? s?.totalSpend ?? 0,
        activeTrips: s?.activeTrips ?? s?.active ?? 0,
      });

      const bookings: any[] = bookingsRes.status === 'fulfilled'
        ? (Array.isArray(bookingsRes.value) ? bookingsRes.value : bookingsRes.value?.bookings ?? [])
        : [];
      setActivity(bookings.map((b: any) => ({
        id: b.id ?? b._id,
        employee: b.employeeName ?? b.userId ?? '—',
        action: `Reserva ${b.serviceType ?? b.type ?? 'transporte'}`,
        time: b.createdAt ? new Date(b.createdAt).toLocaleString('es-ES') : '—',
        amount: b.totalPrice ?? b.amount,
        status: b.status ?? 'pending',
      })));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated') load();
  }, [status, router, load]);

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-[#ff4c41] border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const companyName = (session?.user?.email ?? '').split('@')[1]?.split('.')[0] ?? 'Empresa';

  const STAT_CARDS = [
    { label: 'Reservas pendientes', value: stats?.pendingBookings ?? 0, sub: 'Por aprobar', icon: '📋', color: '#F59E0B' },
    { label: 'Miembros del equipo', value: stats?.teamMembers ?? 0, sub: 'Usuarios activos', icon: '👥', color: '#22C55E' },
    { label: 'Gasto mensual', value: `$${(stats?.monthlySpend ?? 0).toFixed(2)}`, sub: new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }), icon: '💳', color: '#ff4c41' },
    { label: 'Viajes activos', value: stats?.activeTrips ?? 0, sub: 'En progreso', icon: '✈️', color: '#0ea5e9' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">
            Bienvenido, {companyName}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Panel de gestión corporativa · {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            ⚠️ No se pudieron cargar algunos datos. Verifica tu conexión.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(s => (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm font-medium text-gray-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map(a => (
              <button key={a.href} onClick={() => router.push(a.href)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-[#ff4c41] hover:bg-red-50 transition-all">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-sm font-medium text-gray-700">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-4">Actividad Reciente</h2>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No hay actividad reciente</p>
          ) : (
            <div className="space-y-3">
              {activity.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{a.employee}</span>
                    <span className="text-sm text-gray-500"> · {a.action}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    {a.amount && <span className="font-semibold text-gray-700">${a.amount}</span>}
                    <span>{a.time}</span>
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${a.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
