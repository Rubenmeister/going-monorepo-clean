'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

// ─── Tipos ─────────────────────────────────────────────────────

interface WebEvent {
  _id?:        string;
  appId:       string;
  errorType:   string;
  message:     string;
  stack?:      string;
  url:         string;
  userAgent?:  string;
  dedupKey:    string;
  count:       number;
  firstSeen:   string;
  lastSeen:    string;
}

interface WebEventsResponse {
  windowHours: number;
  count:       number;
  events:      WebEvent[];
}

const CEREBRO_URL =
  process.env.NEXT_PUBLIC_CEREBRO_URL ||
  'https://cerebro-service-780842550857.us-central1.run.app';

const APP_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  'frontend-webapp':   { bg: 'bg-orange-50',  text: 'text-orange-700',  emoji: '🌐' },
  'admin-dashboard':   { bg: 'bg-purple-50',  text: 'text-purple-700',  emoji: '🛠️' },
  'corporate-portal':  { bg: 'bg-blue-50',    text: 'text-blue-700',    emoji: '🏢' },
};

const ERROR_TYPE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  js_error:            { bg: 'bg-red-50',     text: 'text-red-700',    label: 'JS error'           },
  unhandled_rejection: { bg: 'bg-orange-50',  text: 'text-orange-700', label: 'Unhandled promise'  },
  network:             { bg: 'bg-blue-50',    text: 'text-blue-700',   label: 'Network'            },
  render:              { bg: 'bg-purple-50',  text: 'text-purple-700', label: 'Render'             },
  other:               { bg: 'bg-gray-50',    text: 'text-gray-700',   label: 'Other'              },
};

type AppFilter = 'all' | 'frontend-webapp' | 'admin-dashboard' | 'corporate-portal';
type HoursFilter = 1 | 6 | 24 | 168;

export default function WebEventsPage() {
  const [data, setData]       = useState<WebEventsResponse | null>(null);
  const [appFilter, setAppFilter] = useState<AppFilter>('all');
  const [hours, setHours]     = useState<HoursFilter>(24);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ hours: String(hours), limit: '100' });
      if (appFilter !== 'all') params.set('app', appFilter);
      const res = await fetch(`${CEREBRO_URL}/cerebro/web-events?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`cerebro ${res.status}`);
      const json = (await res.json()) as WebEventsResponse;
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [appFilter, hours]);

  // Agregaciones para los stat cards
  const stats = useMemo(() => {
    if (!data) return { totalHits: 0, uniqueErrors: 0, affectedApps: 0, topErrorPercent: 0 };
    const totalHits = data.events.reduce((s, e) => s + e.count, 0);
    const uniqueErrors = data.events.length;
    const apps = new Set(data.events.map(e => e.appId));
    const topErrorPercent = totalHits > 0 && data.events.length > 0
      ? Math.round((data.events[0].count / totalHits) * 100)
      : 0;
    return {
      totalHits,
      uniqueErrors,
      affectedApps: apps.size,
      topErrorPercent,
    };
  }, [data]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🐞 Errores JS web</h1>
          <p className="text-sm text-gray-500">
            Errores capturados por <code className="font-mono bg-gray-100 px-1 rounded text-xs">lib/cerebro-tracker.ts</code>{' '}
            en cada web app. Dedup automático por (app, type, stack-top, url). 10% sampling por sesión.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={appFilter}
            onChange={(e) => setAppFilter(e.target.value as AppFilter)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            <option value="all">Todas las apps</option>
            <option value="frontend-webapp">frontend-webapp</option>
            <option value="admin-dashboard">admin-dashboard</option>
            <option value="corporate-portal">corporate-portal</option>
          </select>
          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value) as HoursFilter)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            <option value={1}>Última 1h</option>
            <option value={6}>Últimas 6h</option>
            <option value={24}>Últimas 24h</option>
            <option value={168}>Últimos 7 días</option>
          </select>
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium"
          >
            {loading ? 'Cargando…' : 'Refrescar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Hits totales"      value={stats.totalHits.toString()}      icon="📊" />
        <StatCard title="Errores únicos"    value={stats.uniqueErrors.toString()}   icon="🐞" />
        <StatCard title="Apps afectadas"    value={stats.affectedApps.toString()}   icon="🌐" />
        <StatCard title="Top error %"       value={`${stats.topErrorPercent}%`}     icon="🎯" />
      </div>

      {!loading && data && data.events.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">✨</div>
          <p className="text-gray-600">
            Sin errores en la ventana. Razones posibles:
          </p>
          <ul className="mt-3 text-sm text-gray-500 list-disc inline-block text-left">
            <li>El tracker no está deployed aún (verificar Vercel)</li>
            <li>No hubo tráfico en la ventana (común a horas valle)</li>
            <li>La app está sin bugs (improbable, ojalá)</li>
          </ul>
        </div>
      )}

      {data && data.events.length > 0 && (
        <div className="space-y-2">
          {data.events.map((event) => {
            const appStyle = APP_STYLES[event.appId] ?? { bg: 'bg-gray-50', text: 'text-gray-700', emoji: '🤖' };
            const typeStyle = ERROR_TYPE_STYLES[event.errorType] ?? ERROR_TYPE_STYLES.other;
            const isExpanded = expanded === event.dedupKey;
            return (
              <div
                key={`${event.appId}-${event.dedupKey}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : event.dedupKey)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                >
                  <span className="text-xl">{appStyle.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${appStyle.bg} ${appStyle.text}`}>
                        {event.appId}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${typeStyle.bg} ${typeStyle.text}`}>
                        {typeStyle.label}
                      </span>
                      <span className="text-xs text-gray-500 font-mono">{event.url}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {event.message}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 flex-shrink-0">
                    <div className="font-bold text-lg text-gray-900">×{event.count}</div>
                    <div>{relativeTime(event.lastSeen)}</div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-500 uppercase font-semibold mb-0.5">Primera vez</div>
                        <div className="font-mono">{new Date(event.firstSeen).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 uppercase font-semibold mb-0.5">Última vez</div>
                        <div className="font-mono">{new Date(event.lastSeen).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</div>
                      </div>
                    </div>
                    {event.userAgent && (
                      <div>
                        <div className="text-gray-500 uppercase font-semibold mb-0.5">User agent</div>
                        <div className="font-mono text-gray-700 break-all">{event.userAgent}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-gray-500 uppercase font-semibold mb-0.5">Dedup key</div>
                      <div className="font-mono text-gray-600">{event.dedupKey}</div>
                    </div>
                    {event.stack && (
                      <div>
                        <div className="text-gray-500 uppercase font-semibold mb-0.5">Stack</div>
                        <pre className="p-2 rounded bg-white border border-gray-200 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {event.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
        <strong>Cómo usar esta página:</strong>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Errores ordenados por <code className="font-mono bg-white px-1 rounded">count</code> descendente — los más frecuentes arriba.</li>
          <li>Click sobre un error para ver stack completo + metadata.</li>
          <li>El sampling es 10% por sesión (no por error), así que un error visto ×100 acá probablemente ocurrió ~1000 veces en producción.</li>
          <li>Para reducir el ruido: filtrar por app + ventana corta (1h durante incidentes).</li>
        </ul>
      </div>
    </AdminLayout>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}
