'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout, StatCard } from '../../components';

interface Decision {
  decisionId: string;
  intentionId: string;
  intentionType: string;
  intentionUrgency?: number;
  agentId?: string;
  action?: string;
  args?: Record<string, unknown>;
  safetyLevel?: 1 | 2 | 3;
  status:
    | 'proposed'
    | 'pending_approval'
    | 'approved'
    | 'executing'
    | 'executed'
    | 'rejected'
    | 'expired'
    | 'ignored'
    | 'dormant';
  humanOnlyReason?: string;
  dormantReason?: string;        // 'execute_disabled' | 'above_auto_level:N'
  expiresAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  executedAt?: string;
  outcome?: 'success' | 'failure' | 'unknown';
  outcomeData?: Record<string, unknown>;
  errorMessage?: string;
  createdReceivedAt: string;
}

const ORCH_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ||
  'https://orchestrator-service-780842550857.us-central1.run.app';

const STATUS_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  proposed:         { bg: 'bg-blue-50',    text: 'text-blue-700',   emoji: '📋' },
  pending_approval: { bg: 'bg-orange-50',  text: 'text-orange-700', emoji: '⏳' },
  approved:         { bg: 'bg-green-50',   text: 'text-green-700',  emoji: '✓'  },
  executing:        { bg: 'bg-yellow-50',  text: 'text-yellow-700', emoji: '⚙️' },
  executed:         { bg: 'bg-green-50',   text: 'text-green-700',  emoji: '✅' },
  rejected:         { bg: 'bg-red-50',     text: 'text-red-700',    emoji: '❌' },
  expired:          { bg: 'bg-gray-50',    text: 'text-gray-500',   emoji: '⏰' },
  ignored:          { bg: 'bg-gray-50',    text: 'text-gray-500',   emoji: '⊘' },
  dormant:          { bg: 'bg-purple-50',  text: 'text-purple-700', emoji: '😴' },
};

const SAFETY_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Cat 1 — info' },
  2: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Cat 2 — reversible' },
  3: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cat 3 — irreversible' },
};

type Filter = 'all' | 'pending_approval' | 'executed' | 'ignored' | 'dormant';

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const url =
        filter === 'all'
          ? `${ORCH_URL}/orchestrator/decisions?limit=50`
          : `${ORCH_URL}/orchestrator/decisions?limit=50&status=${filter}`;
      const [decRes, statsRes] = await Promise.all([
        fetch(url, { cache: 'no-store' }),
        fetch(`${ORCH_URL}/orchestrator/stats?hours=168`, { cache: 'no-store' }),
      ]);
      if (!decRes.ok) throw new Error(`orchestrator ${decRes.status}`);
      const decJson = (await decRes.json()) as { decisions: Decision[] };
      setDecisions(decJson.decisions || []);
      if (statsRes.ok) {
        const s = (await statsRes.json()) as { byStatus: Record<string, number> };
        setStats(s.byStatus || {});
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const triggerPoll = async () => {
    try {
      await fetch(`${ORCH_URL}/orchestrator/poll-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      setTimeout(load, 2000);
    } catch (e) {
      setError(`Poll-now falló: ${(e as Error).message}`);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60 * 1000);
    return () => clearInterval(id);
  }, [filter]);

  const totalLast7d = Object.values(stats).reduce((s, v) => s + v, 0);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎯 Orchestrator — Decisiones</h1>
          <p className="text-sm text-gray-500">
            Decisiones tomadas por el Orchestrator a partir de las intenciones de MyCortex.
            Refresh 60s.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            <option value="all">Todas</option>
            <option value="pending_approval">Pendientes ack</option>
            <option value="executed">Ejecutadas</option>
            <option value="dormant">Dormant (no ejecutadas)</option>
            <option value="ignored">Ignoradas (human_only / unknown)</option>
          </select>
          <button
            onClick={triggerPoll}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
          >
            🔄 Poll now
          </button>
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

      {/* Stats últimos 7d */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard
          title="Total 7d"
          value={totalLast7d.toString()}
          icon="📊"
        />
        <StatCard
          title="Ejecutadas"
          value={(stats.executed || 0).toString()}
          icon="✅"
        />
        <StatCard
          title="Pendientes ack"
          value={(stats.pending_approval || 0).toString()}
          icon="⏳"
        />
        <StatCard
          title="Ignoradas"
          value={(stats.ignored || 0).toString()}
          icon="⊘"
        />
        <StatCard
          title="Dormant"
          value={(stats.dormant || 0).toString()}
          icon="😴"
        />
      </div>

      {!loading && decisions.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <p className="text-gray-600">
            {filter === 'all'
              ? 'Sin decisiones registradas todavía. El poller corre cada 5 min.'
              : `Sin decisiones en estado "${filter}".`}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {decisions.map((d) => {
          const status = STATUS_STYLES[d.status] || STATUS_STYLES.proposed;
          const safety = d.safetyLevel ? SAFETY_STYLES[d.safetyLevel] : null;
          const isHumanOnly = d.status === 'ignored' && d.humanOnlyReason;
          return (
            <Link
              key={d.decisionId}
              href={`/cerebro/decisions/${d.decisionId}`}
              className={`block p-5 rounded-2xl border-2 border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm transition`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-bold ${status.bg} ${status.text}`}
                  >
                    {status.emoji} {d.status}
                  </span>
                  {safety && (
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${safety.bg} ${safety.text}`}>
                      {safety.label}
                    </span>
                  )}
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {d.intentionType}
                  </span>
                  {d.intentionUrgency !== undefined && (
                    <span className="text-xs text-gray-600 font-mono">
                      urg {d.intentionUrgency.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-gray-500 flex-shrink-0">
                  {relativeTime(d.createdReceivedAt)}
                </div>
              </div>

              {/* Body — qué hace + por qué */}
              <div className="space-y-2 text-sm">
                {isHumanOnly ? (
                  <div className="p-3 rounded-lg bg-gray-50 text-gray-700">
                    <div className="font-medium text-gray-900 mb-1">Sin acción automática</div>
                    <div className="text-xs text-gray-600 font-mono">
                      Razón: {d.humanOnlyReason}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs uppercase font-semibold text-gray-500">
                      Acción
                    </div>
                    <div className="font-mono text-sm">
                      <span className="text-blue-700">{d.agentId}</span>
                      <span className="text-gray-400 mx-1">.</span>
                      <span className="text-orange-700">{d.action}</span>
                    </div>
                    {d.args && Object.keys(d.args).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                          Args
                        </summary>
                        <pre className="mt-2 p-2 rounded bg-gray-50 text-xs font-mono overflow-x-auto">
                          {JSON.stringify(d.args, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                )}

                {/* Dormant reason — por qué no se ejecutó */}
                {d.status === 'dormant' && d.dormantReason && (
                  <div className="p-2 rounded text-xs bg-purple-50 text-purple-700">
                    {d.dormantReason === 'execute_disabled' && (
                      <>Master switch <code className="font-mono">ORCHESTRATOR_EXECUTE_ENABLED=false</code> — observación pura</>
                    )}
                    {d.dormantReason.startsWith('above_auto_level:') && (
                      <>
                        Cat {d.safetyLevel} requiere{' '}
                        <code className="font-mono">ORCHESTRATOR_MAX_AUTO_LEVEL≥{d.safetyLevel}</code>
                        {' '}(actual: {d.dormantReason.split(':')[1] || '0'})
                      </>
                    )}
                  </div>
                )}

                {/* Outcome */}
                {d.status === 'executed' && (
                  <div
                    className={`p-2 rounded text-xs ${
                      d.outcome === 'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    Outcome: <strong>{d.outcome}</strong>
                    {d.errorMessage && <span className="ml-2">— {d.errorMessage}</span>}
                  </div>
                )}

                {/* Approval / rejection metadata */}
                {d.approvedAt && (
                  <div className="text-xs text-green-700">
                    ✓ Aprobada por {d.approvedBy} · {relativeTime(d.approvedAt)}
                  </div>
                )}
                {d.rejectedAt && (
                  <div className="text-xs text-red-700">
                    ❌ Rechazada por {d.rejectedBy}
                    {d.rejectionReason && ` — ${d.rejectionReason}`}
                  </div>
                )}
                {d.expiresAt && d.status === 'pending_approval' && (
                  <div className="text-xs text-orange-700">
                    Vence {new Date(d.expiresAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-mono">
                <span>decision: {d.decisionId.slice(0, 8)}</span>
                <span>intention: {d.intentionId.slice(0, 8)}</span>
              </div>
            </Link>
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
