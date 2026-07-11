'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout, StatCard } from '../components';

/* ─── Types — espejo de WorldSnapshotEntity del cerebro-service ─── */

type SystemHealth = 'healthy' | 'degraded' | 'critical';

interface PerAgentSummary {
  agentId: string;
  lastRunAt: string | null;
  lastStatus: string;
  ageMinutes: number;
  metrics?: Record<string, number | string>;
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

interface WorldState {
  version?: string;
  note?: string;
  generatedAt: string;
  systemHealth: SystemHealth;
  totalCriticalAnomalies: number;
  totalWarnings: number;
  agents: PerAgentSummary[];
  activeAnomalies: ActiveAnomaly[];
  topProposedActions: ProposedAction[];
  business: Record<string, number | undefined>;
}

const CEREBRO_URL =
  process.env.NEXT_PUBLIC_CEREBRO_URL ||
  'https://cerebro-service-780842550857.us-central1.run.app';

const HEALTH_STYLES: Record<SystemHealth, { bg: string; text: string; emoji: string; label: string }> = {
  healthy:  { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅', label: 'Healthy'  },
  degraded: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⚠️', label: 'Degraded' },
  critical: { bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚨', label: 'Critical' },
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  info:     { bg: 'bg-blue-50',   text: 'text-blue-700',   emoji: 'ℹ️'  },
  warning:  { bg: 'bg-yellow-50', text: 'text-yellow-700', emoji: '⚠️'  },
  critical: { bg: 'bg-red-50',    text: 'text-red-700',    emoji: '🚨' },
};

const authHeaders = (): Record<string, string> => ({
  Authorization:
    'Bearer ' + (typeof window !== 'undefined' ? (localStorage.getItem('authToken') || '') : ''),
});

export default function CerebroOverviewPage() {
  const [state, setState] = useState<WorldState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${CEREBRO_URL}/cerebro/state`, { cache: 'no-store', headers: { ...authHeaders() } });
      if (!res.ok) throw new Error(`cerebro-service ${res.status}`);
      const json = (await res.json()) as WorldState;
      setState(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30 * 1000); // refresh cada 30s
    return () => clearInterval(id);
  }, []);

  const health = state ? HEALTH_STYLES[state.systemHealth] : null;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧠 Cerebro — Estado</h1>
          <p className="text-sm text-gray-500">
            World Model agregado de los 6 agentes. Refresh automático cada 30s.
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium"
        >
          {loading ? 'Cargando…' : 'Refrescar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Error cargando cerebro/state: {error}
        </div>
      )}

      {state && (
        <>
          {/* Header / health */}
          <div className={`mb-6 p-6 rounded-2xl ${health!.bg} flex items-center justify-between`}>
            <div>
              <div className="text-xs text-gray-600 mb-1">System health</div>
              <div className={`text-3xl font-black ${health!.text}`}>
                {health!.emoji} {health!.label}
              </div>
              {state.note && (
                <p className="text-sm text-gray-600 mt-2 italic">{state.note}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-600">Generado</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(state.generatedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
              </div>
              <div className="text-xs text-gray-500 mt-1">Ecuador (UTC-5)</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Anomalías críticas"
              value={state.totalCriticalAnomalies.toString()}
              icon="🚨"
            />
            <StatCard
              title="Warnings"
              value={state.totalWarnings.toString()}
              icon="⚠️"
            />
            <StatCard
              title="Agentes con datos"
              value={`${state.agents.filter(a => a.lastRunAt !== null).length}/6`}
              icon="🤖"
            />
            <StatCard
              title="Acciones propuestas (agents)"
              value={state.topProposedActions.length.toString()}
              icon="💡"
            />
          </div>

          {/* Agents */}
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Agentes</h2>
              <p className="text-sm text-gray-500">Último run + métricas reportadas</p>
            </div>
            <div className="divide-y divide-gray-100">
              {state.agents.map((agent) => (
                <div key={agent.agentId} className="px-6 py-4 flex items-start gap-4">
                  <div className="text-2xl">{getAgentEmoji(agent.agentId)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-gray-900">{agent.agentId}</div>
                      <StatusPill status={agent.lastStatus} />
                      {agent.lastRunAt && (
                        <span className="text-xs text-gray-500">
                          hace {agent.ageMinutes} min
                        </span>
                      )}
                    </div>
                    {agent.metrics && Object.keys(agent.metrics).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {Object.entries(agent.metrics)
                          .filter(([_, v]) => typeof v === 'number')
                          .slice(0, 6)
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono"
                            >
                              {k}={String(v)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {agent.criticalCount > 0 && (
                      <div className="text-red-600 font-bold">🚨 {agent.criticalCount}</div>
                    )}
                    {agent.warningCount > 0 && (
                      <div className="text-yellow-600">⚠️ {agent.warningCount}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active anomalies */}
          {state.activeAnomalies.length > 0 && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Anomalías activas</h2>
                <p className="text-sm text-gray-500">
                  {state.activeAnomalies.length} totales · ordenadas por severidad
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {state.activeAnomalies.slice(0, 20).map((a, idx) => {
                  const sev = SEVERITY_STYLES[a.severity] || SEVERITY_STYLES.info;
                  return (
                    <div key={idx} className={`px-6 py-3 flex items-start gap-3 ${sev.bg}`}>
                      <span className="text-lg">{sev.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase ${sev.text}`}>
                            {a.severity}
                          </span>
                          <span className="text-xs text-gray-500">[{a.agentId}]</span>
                          <span className="text-xs font-mono text-gray-600">{a.type}</span>
                        </div>
                        <div className="text-sm text-gray-900 mt-1">{a.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top proposed actions from agents */}
          {state.topProposedActions.length > 0 && (
            <div className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Acciones propuestas (por agentes)
                  </h2>
                  <p className="text-sm text-gray-500">
                    Estas son las propuestas determinísticas. Para las propuestas IA de
                    MyCortex, mira{' '}
                    <Link href="/cerebro/intentions" className="text-blue-600 hover:underline">
                      Intenciones
                    </Link>
                  </p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {state.topProposedActions.slice(0, 10).map((p, idx) => (
                  <div key={idx} className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <UrgencyDot urgency={p.urgency} />
                      <span className="font-mono text-sm font-semibold">{p.type}</span>
                      <span className="text-xs text-gray-500">[{p.agentId}]</span>
                      {p.target && (
                        <span className="text-xs text-gray-600 font-mono">→ {p.target}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 mt-1 ml-6">{p.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business metrics */}
          {state.business && Object.keys(state.business).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Métricas de negocio</h2>
                <p className="text-sm text-gray-500">
                  Derivadas de los eventos de los agentes
                </p>
              </div>
              <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(state.business)
                  .filter(([_, v]) => v !== undefined && v !== null)
                  .map(([k, v]) => (
                    <div key={k} className="p-3 rounded-lg bg-gray-50">
                      <div className="text-xs text-gray-500 mb-1">{k}</div>
                      <div className="text-lg font-bold text-gray-900">{String(v)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}

/* ─── Helpers de UI ─────────────────────────────────────────── */

function getAgentEmoji(id: string): string {
  const map: Record<string, string> = {
    'ops-agent':                '🚦',
    'financial-agent':          '💰',
    'content-agent':            '📰',
    'marketing-agent':          '📣',
    'going-agent':              '🤖',
    'customer-support-service': '💬',
  };
  return map[id] || '🔵';
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    success:         { bg: 'bg-green-100',  text: 'text-green-700' },
    partial_failure: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    failure:         { bg: 'bg-red-100',    text: 'text-red-700' },
    unknown:         { bg: 'bg-gray-100',   text: 'text-gray-500' },
  };
  const style = map[status] || map.unknown;
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${style.bg} ${style.text}`}>
      {status}
    </span>
  );
}

function UrgencyDot({ urgency }: { urgency: number }) {
  let color = 'bg-gray-300';
  if (urgency >= 0.8) color = 'bg-red-500';
  else if (urgency >= 0.5) color = 'bg-orange-400';
  else if (urgency >= 0.3) color = 'bg-yellow-400';
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-mono text-gray-600">{urgency.toFixed(2)}</span>
    </span>
  );
}
