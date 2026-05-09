'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components';

interface AgentEvent {
  agentId: string;
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'success' | 'partial_failure' | 'failure';
  metrics: Record<string, number | string>;
  anomalies: Array<{ type: string; severity: string; message: string }>;
  actionsTaken: Array<{ type: string; target?: string; result: string }>;
  actionsProposed: Array<{ type: string; reason: string; urgency?: number }>;
  receivedAt: string;
}

const CEREBRO_URL =
  process.env.NEXT_PUBLIC_CEREBRO_URL ||
  'https://cerebro-service-780842550857.us-central1.run.app';

const AGENT_IDS = [
  'all',
  'ops-agent',
  'financial-agent',
  'content-agent',
  'marketing-agent',
  'going-agent',
  'customer-support-service',
] as const;

const AGENT_LABELS: Record<string, string> = {
  all:                          'Todos',
  'ops-agent':                  '🚦 Ops',
  'financial-agent':            '💰 Financial',
  'content-agent':              '📰 Content',
  'marketing-agent':            '📣 Marketing',
  'going-agent':                '🤖 Going',
  'customer-support-service':   '💬 Customer Support',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  success:         { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅' },
  partial_failure: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⚠️' },
  failure:         { bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚨' },
};

export default function EventsPage() {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        agentFilter === 'all'
          ? `${CEREBRO_URL}/cerebro/events?limit=50`
          : `${CEREBRO_URL}/cerebro/events/${agentFilter}?limit=50`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`cerebro-service ${res.status}`);
      const json = (await res.json()) as { events: AgentEvent[] };
      setEvents(json.events || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30 * 1000);
    return () => clearInterval(id);
  }, [agentFilter]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📡 Cerebro — Eventos</h1>
          <p className="text-sm text-gray-500">
            Feed crudo de los AgentRunEvents que llegan vía Pub/Sub. Refresh 30s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            {AGENT_IDS.map((id) => (
              <option key={id} value={id}>
                {AGENT_LABELS[id]}
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

      {!loading && events.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <p className="text-gray-600">
            Sin eventos {agentFilter !== 'all' ? `de ${agentFilter}` : ''} en este momento.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Los agents publican según sus crons naturales. Si recién activaste, esperá
            algunos minutos.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {events.map((evt) => {
          const status = STATUS_STYLES[evt.status] || STATUS_STYLES.success;
          const critCount = evt.anomalies?.filter((a) => a.severity === 'critical').length || 0;
          const warnCount = evt.anomalies?.filter((a) => a.severity === 'warning').length || 0;
          return (
            <details
              key={evt.runId}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <summary className="cursor-pointer px-4 py-3 hover:bg-gray-50 select-none">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-lg">{status.emoji}</span>
                  <span className="font-semibold text-gray-900">
                    {AGENT_LABELS[evt.agentId] || evt.agentId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}
                  >
                    {evt.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {evt.durationMs}ms · {relativeTime(evt.finishedAt)}
                  </span>
                  {critCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-bold">
                      🚨 {critCount}
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-bold">
                      ⚠️ {warnCount}
                    </span>
                  )}
                  {evt.actionsTaken && evt.actionsTaken.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {evt.actionsTaken.length} acciones
                    </span>
                  )}
                  <span className="ml-auto text-xs font-mono text-gray-400">
                    {evt.runId.slice(0, 8)}
                  </span>
                </div>
              </summary>

              <div className="px-4 py-3 border-t border-gray-100 space-y-3 bg-gray-50">
                {/* Metrics */}
                {evt.metrics && Object.keys(evt.metrics).length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-semibold text-gray-500 mb-1">
                      Métricas
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(evt.metrics).map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-white border border-gray-200 text-xs font-mono"
                        >
                          {k}={String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Anomalies */}
                {evt.anomalies && evt.anomalies.length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-semibold text-gray-500 mb-1">
                      Anomalías ({evt.anomalies.length})
                    </div>
                    <div className="space-y-1">
                      {evt.anomalies.map((a, idx) => (
                        <div key={idx} className="text-sm flex items-start gap-2">
                          <span>{a.severity === 'critical' ? '🚨' : a.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
                          <div>
                            <span className="font-mono text-xs text-gray-600">{a.type}:</span>{' '}
                            <span className="text-gray-800">{a.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions taken */}
                {evt.actionsTaken && evt.actionsTaken.length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-semibold text-gray-500 mb-1">
                      Acciones tomadas
                    </div>
                    <div className="space-y-1">
                      {evt.actionsTaken.map((a, idx) => (
                        <div key={idx} className="text-sm flex items-start gap-2">
                          <span>{a.result === 'ok' ? '✓' : a.result === 'failed' ? '✗' : '⊘'}</span>
                          <div>
                            <span className="font-mono text-xs text-gray-600">{a.type}</span>{' '}
                            {a.target && (
                              <span className="text-xs text-gray-500">→ {a.target}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions proposed */}
                {evt.actionsProposed && evt.actionsProposed.length > 0 && (
                  <div>
                    <div className="text-xs uppercase font-semibold text-gray-500 mb-1">
                      Acciones propuestas
                    </div>
                    <div className="space-y-1">
                      {evt.actionsProposed.map((a, idx) => (
                        <div key={idx} className="text-sm flex items-start gap-2">
                          <span>💡</span>
                          <div>
                            <span className="font-mono text-xs text-gray-600">{a.type}</span>
                            {a.urgency !== undefined && (
                              <span className="text-xs text-gray-500"> ({a.urgency.toFixed(2)})</span>
                            )}
                            <div className="text-xs text-gray-700">{a.reason}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
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
