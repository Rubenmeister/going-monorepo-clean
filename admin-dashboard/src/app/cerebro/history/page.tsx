'use client';
export const dynamic = 'force-dynamic';

/**
 * /cerebro/history
 *
 * Timeline de world snapshots del cerebro-service. Cada snapshot es la
 * foto del estado de los agentes en un momento dado (cron @10min). Sirve
 * para auditar evolución y entender cómo cambió el mundo entre dos
 * decisiones de mycortex.
 *
 * Endpoint: GET /cerebro/state/history?limit=N → { count, snapshots }
 */

import { useEffect, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

type SystemHealth = 'healthy' | 'degraded' | 'critical';

interface PerAgentSummary {
  agentId: string;
  lastRunAt: string | null;
  lastStatus: string;
  ageMinutes: number;
  anomaliesCount: number;
  criticalCount: number;
  warningCount: number;
}

interface ActiveAnomaly {
  agentId: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  detectedAt: string;
}

interface ProposedAction {
  agentId: string;
  type: string;
  reason: string;
  urgency: number;
  target?: string;
  proposedAt: string;
}

interface Snapshot {
  generatedAt: string;
  systemHealth: SystemHealth;
  totalCriticalAnomalies: number;
  totalWarnings: number;
  agents?: PerAgentSummary[];
  activeAnomalies?: ActiveAnomaly[];
  topProposedActions?: ProposedAction[];
  changedSinceLast?: { fields?: string[]; summary?: string };
}

const CEREBRO_URL =
  process.env.NEXT_PUBLIC_CEREBRO_URL ||
  'https://cerebro-service-780842550857.us-central1.run.app';

const HEALTH_STYLES: Record<SystemHealth, { bg: string; text: string; emoji: string }> = {
  healthy:  { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅' },
  degraded: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⚠️' },
  critical: { bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚨' },
};

const LIMITS = [20, 50, 100, 200];

const authHeaders = (): Record<string, string> => ({
  Authorization:
    'Bearer ' + (typeof window !== 'undefined' ? (localStorage.getItem('authToken') || '') : ''),
});

export default function CerebroHistoryPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<number>(50);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CEREBRO_URL}/cerebro/state/history?limit=${limit}`, {
        cache: 'no-store',
        headers: { ...authHeaders() },
      });
      if (!res.ok) throw new Error(`cerebro-service ${res.status}`);
      const json = (await res.json()) as { count: number; snapshots: Snapshot[] };
      setSnapshots(json.snapshots || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60 * 1000);
    return () => clearInterval(id);
  }, [limit]);

  const healthDistribution = snapshots.reduce(
    (acc, s) => {
      acc[s.systemHealth]++;
      return acc;
    },
    { healthy: 0, degraded: 0, critical: 0 } as Record<SystemHealth, number>,
  );

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📜 World snapshots — Histórico</h1>
          <p className="text-sm text-gray-500">
            Cada 10 min el cerebro persiste un snapshot del estado del mundo.
            Refresh 60s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            {LIMITS.map((l) => (
              <option key={l} value={l}>
                Últimos {l}
              </option>
            ))}
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
        <StatCard title="Snapshots" value={snapshots.length.toString()} icon="📊" />
        <StatCard title="✅ Healthy" value={healthDistribution.healthy.toString()} icon="✅" />
        <StatCard title="⚠️ Degraded" value={healthDistribution.degraded.toString()} icon="⚠️" />
        <StatCard title="🚨 Critical" value={healthDistribution.critical.toString()} icon="🚨" />
      </div>

      {!loading && snapshots.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-600">Sin snapshots todavía — el cron del WorldModel corre cada 10 min.</p>
        </div>
      )}

      <div className="space-y-2">
        {snapshots.map((s, idx) => {
          const health = HEALTH_STYLES[s.systemHealth] || HEALTH_STYLES.healthy;
          const isExpanded = expandedIdx === idx;
          return (
            <div
              key={s.generatedAt + idx}
              className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                className="w-full p-4 hover:bg-gray-50 text-left"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold ${health.bg} ${health.text}`}
                    >
                      {health.emoji} {s.systemHealth}
                    </span>
                    <span className="font-mono text-sm text-gray-700">
                      {new Date(s.generatedAt).toLocaleString('es-EC', {
                        timeZone: 'America/Guayaquil',
                      })}
                    </span>
                    <span className="text-xs text-gray-500">{relativeTime(s.generatedAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {s.totalCriticalAnomalies > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold">
                        🚨 {s.totalCriticalAnomalies}
                      </span>
                    )}
                    {s.totalWarnings > 0 && (
                      <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 font-bold">
                        ⚠️ {s.totalWarnings}
                      </span>
                    )}
                    <span className="text-gray-500">
                      {(s.agents?.length ?? 0)} agentes · {(s.topProposedActions?.length ?? 0)} propuestas
                    </span>
                    <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </div>
                {s.changedSinceLast?.summary && (
                  <div className="mt-2 text-xs text-blue-700 font-mono">
                    Δ {s.changedSinceLast.summary}
                  </div>
                )}
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-gray-100 space-y-3">
                  {/* Anomalías */}
                  {s.activeAnomalies && s.activeAnomalies.length > 0 && (
                    <div>
                      <div className="text-xs uppercase font-semibold text-gray-500 mb-2">
                        Anomalías activas ({s.activeAnomalies.length})
                      </div>
                      <ul className="space-y-1">
                        {s.activeAnomalies.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="font-mono text-xs px-1 py-0.5 rounded bg-gray-100 text-gray-700">
                              {a.agentId}
                            </span>
                            <span className="font-mono text-xs">{a.type}</span>
                            <span className="text-gray-600">{a.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Acciones propuestas */}
                  {s.topProposedActions && s.topProposedActions.length > 0 && (
                    <div>
                      <div className="text-xs uppercase font-semibold text-gray-500 mb-2">
                        Top acciones propuestas
                      </div>
                      <ul className="space-y-1">
                        {s.topProposedActions.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="font-mono text-xs px-1 py-0.5 rounded bg-orange-50 text-orange-700">
                              urg {p.urgency.toFixed(2)}
                            </span>
                            <span className="font-mono text-xs">{p.type}</span>
                            <span className="text-gray-600">{p.reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Agentes summary compacto */}
                  {s.agents && s.agents.length > 0 && (
                    <div>
                      <div className="text-xs uppercase font-semibold text-gray-500 mb-2">
                        Agentes ({s.agents.length})
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {s.agents.map((a) => (
                          <div
                            key={a.agentId}
                            className="text-xs p-2 rounded bg-gray-50 flex items-center justify-between"
                          >
                            <span className="font-mono">{a.agentId}</span>
                            <span className="text-gray-500">
                              {a.lastRunAt
                                ? `${a.ageMinutes}min`
                                : 'sin reportes'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'recién';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
}
