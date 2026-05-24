'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

// ─── Tipos ─────────────────────────────────────────────────────
//
// agent-bridge-service GET /agents:
//   { total, agents: [{ agentId, kind, target }] }
//
// orchestrator-service GET /orchestrator/agents/overrides (task #31):
//   { total, agents: [{ agentId, paused, pausedAt, pausedBy, pauseReason, ... }] }
//
// Mergeamos por agentId: bridge da kind+target (qué es), orchestrator da
// estado pausado + auditoría. Source-of-truth para "está activo": override.

interface BridgeAgent {
  agentId: string;
  kind:    'cloud-run-job' | 'http-service';
  target:  string;
}

interface BridgeResponse {
  total:  number;
  agents: BridgeAgent[];
}

interface OverrideAgent {
  agentId:      string;
  paused:       boolean;
  pausedAt?:    string;
  pausedBy?:    string;
  pauseReason?: string;
  unpausedAt?:  string;
  unpausedBy?:  string;
}

interface OverridesResponse {
  total:  number;
  agents: OverrideAgent[];
}

interface MergedAgent extends BridgeAgent, Partial<Omit<OverrideAgent, 'agentId'>> {
  /** True si está en RULES pero NO en bridge (huérfano en RULES) */
  orphanInBridge?: boolean;
}

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_AGENT_BRIDGE_URL ||
  'https://agent-bridge-service-780842550857.us-central1.run.app';
const ORCHESTRATOR_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ||
  'https://orchestrator-service-780842550857.us-central1.run.app';

const KIND_STYLES = {
  'cloud-run-job': {
    bg:    'bg-blue-50',
    border:'border-l-blue-500',
    text:  'text-blue-700',
    label: 'Cloud Run Job',
    desc:  'Cron-triggered. Recibe COMMAND_JSON via env var override.',
    icon:  '⏰',
  },
  'http-service': {
    bg:    'bg-purple-50',
    border:'border-l-purple-500',
    text:  'text-purple-700',
    label: 'HTTP Service',
    desc:  'Always-on. Recibe POST /command con body { decisionId, action, payload }.',
    icon:  '🌐',
  },
} as const;

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000)          return 'hace <1min';
  if (ms < 3_600_000)       return `hace ${Math.floor(ms / 60_000)}min`;
  if (ms < 86_400_000)      return `hace ${Math.floor(ms / 3_600_000)}h`;
  return `hace ${Math.floor(ms / 86_400_000)}d`;
}

export default function AgentsPage() {
  const [bridgeData, setBridgeData]       = useState<BridgeResponse | null>(null);
  const [overrideData, setOverrideData]   = useState<OverridesResponse | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [actioning, setActioning]         = useState<string | null>(null);

  // Modal pause
  const [pauseTarget, setPauseTarget]     = useState<string | null>(null);
  const [pauseReason, setPauseReason]     = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bridgeRes, overrideRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/agents`,                          { cache: 'no-store' }),
        fetch(`${ORCHESTRATOR_URL}/orchestrator/agents/overrides`, { cache: 'no-store' }),
      ]);
      if (!bridgeRes.ok)   throw new Error(`agent-bridge ${bridgeRes.status}`);
      if (!overrideRes.ok) throw new Error(`orchestrator ${overrideRes.status}`);
      setBridgeData(await bridgeRes.json());
      setOverrideData(await overrideRes.json());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /** Quién hace la acción — del JWT del admin (cambiar a contexto real cuando exista). */
  const adminId = (typeof window !== 'undefined' && localStorage.getItem('userEmail')) || 'admin';

  const confirmPause = async () => {
    if (!pauseTarget) return;
    setActioning(pauseTarget);
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/orchestrator/agents/${pauseTarget}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pausedBy: adminId, reason: pauseReason }),
      });
      if (!res.ok) throw new Error(`pause ${res.status}`);
      setPauseTarget(null);
      setPauseReason('');
      await load();
    } catch (e) {
      alert(`Error pausando: ${(e as Error).message}`);
    } finally {
      setActioning(null);
    }
  };

  const handleUnpause = async (agentId: string) => {
    if (!confirm(`¿Despausar ${agentId}? El orchestrator volverá a despachar a este agente.`)) return;
    setActioning(agentId);
    try {
      const res = await fetch(`${ORCHESTRATOR_URL}/orchestrator/agents/${agentId}/unpause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unpausedBy: adminId }),
      });
      if (!res.ok) throw new Error(`unpause ${res.status}`);
      await load();
    } catch (e) {
      alert(`Error despausando: ${(e as Error).message}`);
    } finally {
      setActioning(null);
    }
  };

  // Merge bridge + overrides por agentId. La lista de bridge define el shape
  // (kind + target); overrides añade el estado pausado.
  const merged: MergedAgent[] = useMemo(() => {
    const overrideByAgent = new Map(
      (overrideData?.agents ?? []).map((o) => [o.agentId, o]),
    );
    return (bridgeData?.agents ?? []).map((b) => {
      const ov = overrideByAgent.get(b.agentId);
      return {
        ...b,
        paused:      ov?.paused ?? false,
        pausedAt:    ov?.pausedAt,
        pausedBy:    ov?.pausedBy,
        pauseReason: ov?.pauseReason,
        unpausedAt:  ov?.unpausedAt,
        unpausedBy:  ov?.unpausedBy,
      };
    });
  }, [bridgeData, overrideData]);

  const pausedCount = merged.filter((a) => a.paused).length;

  const grouped = useMemo(() => {
    const out: Record<'cloud-run-job' | 'http-service', MergedAgent[]> = {
      'cloud-run-job': [],
      'http-service':  [],
    };
    for (const a of merged) out[a.kind].push(a);
    return out;
  }, [merged]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🤖 Agent Registry & Overrides</h1>
          <p className="text-sm text-gray-500">
            Agentes que el Orchestrator (<code className="font-mono bg-gray-100 px-1 rounded text-xs">Wayra</code>)
            puede invocar. Pausa un agente para freezar despachos en ≤30s sin tocar el master switch.
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

      {pausedCount > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-orange-50 border-2 border-orange-300 flex items-start gap-3">
          <span className="text-2xl">⏸️</span>
          <div className="flex-1">
            <p className="font-bold text-orange-900">
              {pausedCount} {pausedCount === 1 ? 'agente pausado' : 'agentes pausados'} —
              el orchestrator NO despacha a {pausedCount === 1 ? 'él' : 'ellos'}.
            </p>
            <p className="text-sm text-orange-700 mt-1">
              Las decisiones que apunten a {pausedCount === 1 ? 'este agente' : 'estos agentes'}
              quedan como <code className="font-mono bg-orange-100 px-1 rounded">dormant</code>
              {' '}(reason: <code className="font-mono bg-orange-100 px-1 rounded">agent_paused</code>).
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Total registrados" value={(bridgeData?.total ?? 0).toString()} icon="🤖" />
        <StatCard title="Cron Jobs"          value={grouped['cloud-run-job'].length.toString()} icon="⏰" />
        <StatCard title="HTTP Services"      value={grouped['http-service'].length.toString()}  icon="🌐" />
        <StatCard title="Pausados"           value={pausedCount.toString()}                     icon="⏸️" />
      </div>

      {!loading && bridgeData && bridgeData.total === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">🤖</div>
          <p className="text-gray-600">Sin agentes registrados.</p>
        </div>
      )}

      {(['cloud-run-job', 'http-service'] as const).map((kind) => {
        const list = grouped[kind];
        if (list.length === 0) return null;
        const style = KIND_STYLES[kind];
        return (
          <section key={kind} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{style.icon}</span>
              <h2 className={`text-lg font-bold ${style.text}`}>{style.label}</h2>
              <span className="text-xs text-gray-500">{style.desc}</span>
              <span className="text-xs text-gray-400 ml-auto font-mono">
                {list.length} {list.length === 1 ? 'agent' : 'agents'}
              </span>
            </div>
            <div className="space-y-2">
              {list.map((a) => {
                const isPaused = a.paused === true;
                const isWorking = actioning === a.agentId;
                return (
                  <div
                    key={a.agentId}
                    className={`p-4 rounded-xl bg-white border-2 ${isPaused ? 'border-orange-300' : 'border-gray-100'} border-l-4 ${isPaused ? 'border-l-orange-500' : style.border}`}
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-bold text-gray-900">
                          {a.agentId}
                        </span>
                        {isPaused ? (
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold border border-orange-300">
                            ⏸️ PAUSADO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200">
                            ▶ activo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isPaused ? (
                          <button
                            onClick={() => handleUnpause(a.agentId)}
                            disabled={isWorking}
                            className="px-3 py-1 text-xs font-bold rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                          >
                            {isWorking ? '…' : '▶ Despausar'}
                          </button>
                        ) : (
                          <button
                            onClick={() => setPauseTarget(a.agentId)}
                            disabled={isWorking}
                            className="px-3 py-1 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                          >
                            ⏸ Pausar
                          </button>
                        )}
                      </div>
                    </div>
                    <code className="text-xs font-mono text-gray-500 block mt-2 truncate" title={a.target}>
                      {a.target}
                    </code>
                    {isPaused && (
                      <div className="mt-2 p-2 rounded-lg bg-orange-50 text-xs text-orange-900">
                        <strong>{a.pausedBy ?? 'unknown'}</strong> pausó {timeAgo(a.pausedAt)}
                        {a.pauseReason && <> — &ldquo;{a.pauseReason}&rdquo;</>}
                      </div>
                    )}
                    {!isPaused && a.unpausedAt && (
                      <div className="mt-2 text-xs text-gray-500">
                        Último unpause: {a.unpausedBy} {timeAgo(a.unpausedAt)}
                        {a.pausedBy && (
                          <> · pausa anterior por {a.pausedBy}
                          {a.pauseReason && <> (&ldquo;{a.pauseReason}&rdquo;)</>}</>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {/* Modal: razón de la pausa */}
      {pauseTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPauseTarget(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ⏸️ Pausar <code className="font-mono text-orange-700">{pauseTarget}</code>
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              El orchestrator dejará de despachar a este agente en ≤30s. Las decisiones
              pendientes quedarán como <code className="font-mono text-xs">dormant</code>.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Razón (opcional pero recomendado)
            </label>
            <textarea
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder='ej. "alarmas falsas desde el deploy de hoy"'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              maxLength={500}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { setPauseTarget(null); setPauseReason(''); }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPause}
                disabled={actioning === pauseTarget}
                className="px-4 py-2 text-sm font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
              >
                {actioning === pauseTarget ? 'Pausando…' : 'Pausar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
        <strong>Notas:</strong>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>
            La pausa entra en efecto en ≤30s (TTL del cache del dispatcher). Para corte
            inmediato total, usar el kill-switch global:{' '}
            <code className="font-mono bg-white px-1 rounded text-xs">
              gcloud run services update orchestrator-service --update-env-vars=ORCHESTRATOR_EXECUTE_ENABLED=false
            </code>
          </li>
          <li>
            Las pausas se persisten en Mongo (DB <code className="font-mono text-xs">going-orchestrator</code>,
            collection <code className="font-mono text-xs">orchestrator_agent_overrides</code>). Sobreviven a
            redeploys.
          </li>
          <li>
            La lista de agentes viene de{' '}
            <code className="font-mono bg-white px-1 rounded text-xs">agent-bridge AGENT_REGISTRY</code>.
            Las reglas que apuntan a cada agentId viven en{' '}
            <a href="/cerebro/rules" className="underline font-medium">/cerebro/rules</a>.
          </li>
        </ul>
      </div>
    </AdminLayout>
  );
}
