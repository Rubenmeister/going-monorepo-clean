'use client';
export const dynamic = 'force-dynamic';

/**
 * /cerebro/approvals
 *
 * Cola de decisiones Cat 3 en pending_approval — el orchestrator pidió
 * confirmación (vía Telegram con timeout 15 min) y acá el admin puede
 * aprobar/rechazar con un click sin depender del bot de Telegram.
 *
 * Endpoints consumidos (orchestrator-service):
 *   GET  /orchestrator/pending-approvals
 *   POST /orchestrator/decisions/:id/approve   { approvedBy }
 *   POST /orchestrator/decisions/:id/reject    { rejectedBy, reason }
 */

import { useEffect, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

interface PendingDecision {
  decisionId: string;
  intentionId: string;
  intentionType: string;
  intentionUrgency?: number;
  agentId?: string;
  action?: string;
  args?: Record<string, unknown>;
  safetyLevel?: 1 | 2 | 3;
  status: string;
  expiresAt?: string;
  createdReceivedAt: string;
}

const ORCH_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ||
  'https://orchestrator-service-780842550857.us-central1.run.app';

export default function ApprovalsPage() {
  const [pending, setPending] = useState<PendingDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState<number>(Date.now());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ORCH_URL}/orchestrator/pending-approvals`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`orchestrator ${res.status}`);
      const json = (await res.json()) as { list?: PendingDecision[] };
      setPending(json.list || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (d: PendingDecision) => {
    if (!confirm(`Aprobar y EJECUTAR ${d.intentionType} (${d.agentId}.${d.action})?`)) return;
    setBusyId(d.decisionId);
    try {
      const res = await fetch(`${ORCH_URL}/orchestrator/decisions/${d.decisionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'admin-dashboard' }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.error) throw new Error(json.error);
      await load();
    } catch (e) {
      setError(`Aprobar falló: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (d: PendingDecision) => {
    const reason = prompt(`Rechazar ${d.intentionType}. Motivo (opcional):`, '');
    if (reason === null) return;
    setBusyId(d.decisionId);
    try {
      const res = await fetch(`${ORCH_URL}/orchestrator/decisions/${d.decisionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: 'admin-dashboard', reason: reason || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.error) throw new Error(json.error);
      await load();
    } catch (e) {
      setError(`Rechazar falló: ${(e as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh cada 30s (vencen en 15 min, queremos responsividad).
    const id = setInterval(load, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Tick por segundo para el countdown del expiresAt.
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const urgentCount = pending.filter((d) => msToExpiry(d.expiresAt, now) < 5 * 60_000).length;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⏳ Aprobaciones pendientes — Cat 3</h1>
          <p className="text-sm text-gray-500">
            Acciones irreversibles esperando ack. Refresh 30s. Aprobás aquí y se
            ejecutan sin pasar por Telegram.
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
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <StatCard title="En cola" value={pending.length.toString()} icon="⏳" />
        <StatCard title="< 5 min para vencer" value={urgentCount.toString()} icon="🔥" />
        <StatCard
          title="Cat 3"
          value={pending.filter((d) => d.safetyLevel === 3).length.toString()}
          icon="🛑"
        />
      </div>

      {!loading && pending.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">✨</div>
          <p className="text-gray-600">Sin aprobaciones pendientes — todo controlado.</p>
        </div>
      )}

      <div className="space-y-3">
        {pending.map((d) => {
          const msLeft = msToExpiry(d.expiresAt, now);
          const urgent = msLeft >= 0 && msLeft < 5 * 60_000;
          return (
            <div
              key={d.decisionId}
              className={`p-5 rounded-2xl border-2 bg-white shadow-sm ${
                urgent ? 'border-red-300' : 'border-orange-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700">
                    🛑 Cat {d.safetyLevel ?? 3} — irreversible
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {d.intentionType}
                  </span>
                  {d.intentionUrgency !== undefined && (
                    <span className="text-xs text-gray-600 font-mono">
                      urg {d.intentionUrgency.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className={`text-right text-xs font-mono ${urgent ? 'text-red-600 font-bold' : 'text-orange-700'}`}>
                  {formatCountdown(msLeft)}
                </div>
              </div>

              {/* Acción a ejecutar */}
              <div className="mb-3">
                <div className="text-xs uppercase font-semibold text-gray-500 mb-1">
                  Acción a ejecutar
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

              {/* Botones */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => approve(d)}
                  disabled={busyId === d.decisionId}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm font-bold"
                >
                  {busyId === d.decisionId ? '…' : '✓ Aprobar y ejecutar'}
                </button>
                <button
                  onClick={() => reject(d)}
                  disabled={busyId === d.decisionId}
                  className="px-4 py-2 rounded-lg bg-white border border-red-300 hover:bg-red-50 disabled:bg-gray-100 text-red-700 text-sm font-bold"
                >
                  ✕ Rechazar
                </button>
                <span className="ml-auto text-xs text-gray-500 font-mono">
                  decision: {d.decisionId.slice(0, 8)} · intention: {d.intentionId.slice(0, 8)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}

function msToExpiry(iso: string | undefined, now: number): number {
  if (!iso) return Infinity;
  return new Date(iso).getTime() - now;
}

function formatCountdown(ms: number): string {
  if (!isFinite(ms)) return 'sin vencimiento';
  if (ms < 0) return '⏰ vencida';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `vence en ${sec}s`;
  return `vence en ${min}m ${sec.toString().padStart(2, '0')}s`;
}
