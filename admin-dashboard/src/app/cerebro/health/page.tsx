'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

// ─── Tipos ─────────────────────────────────────────────────────

interface PerAgentSummary {
  agentId: string;
  lastRunAt: string | null;
  lastStatus: string;
  ageMinutes: number;
}

interface WorldState {
  generatedAt: string;
  systemHealth: 'healthy' | 'degraded' | 'critical';
  agents: PerAgentSummary[];
}

interface CortexConfig {
  enabled: boolean;
  systemPrompt: string;
  model: string;
  pollIntervalMin: number | null;
  updatedAt: string | null;
}

interface OrchestratorStatus {
  executeEnabled: boolean;
  maxAutoLevel: 0 | 1 | 2 | 3;
  pollEnabled: boolean;
  activeCats: number[];
}

const CEREBRO_URL =
  process.env.NEXT_PUBLIC_CEREBRO_URL ||
  'https://cerebro-service-780842550857.us-central1.run.app';
const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';
const ORCH_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ||
  'https://orchestrator-service-780842550857.us-central1.run.app';

// ─── Thresholds (espejo de cerebro-service/world-model.service.ts) ────
//
// Si un agent supera esta edad, es STALE. Si nunca publicó, es NEW
// (sospechoso si lleva más que estos minutos desde el deploy del cerebro).

interface AgentMeta {
  expectedCron:    string;
  staleThresholdMin: number;
  emoji:           string;
}

const AGENT_META: Record<string, AgentMeta> = {
  'ops-agent':                { expectedCron: 'cada 15 min',       staleThresholdMin: 60,        emoji: '🚦' },
  'financial-agent':          { expectedCron: '4x/día (8h max)',   staleThresholdMin: 60 * 8,    emoji: '💰' },
  'content-agent':            { expectedCron: 'semanal (lun 9am)', staleThresholdMin: 60 * 24 * 8, emoji: '📝' },
  'marketing-agent':          { expectedCron: 'semanal (lun 9am)', staleThresholdMin: 60 * 24 * 8, emoji: '📈' },
  'going-agent':              { expectedCron: 'cada 6h',           staleThresholdMin: 60 * 24,   emoji: '🤖' },
  'customer-support-service': { expectedCron: 'interno 10 min',    staleThresholdMin: 40,        emoji: '💬' },
  'mobile-agent':             { expectedCron: 'cada 6h',           staleThresholdMin: 60 * 24,   emoji: '📱' },
  'frontend-agent':           { expectedCron: 'cada 6h',           staleThresholdMin: 60 * 24,   emoji: '🌐' },
};

type Health = 'ok' | 'stale' | 'new' | 'failure';

function classifyAgent(agent: PerAgentSummary): Health {
  const meta = AGENT_META[agent.agentId];
  if (!agent.lastRunAt) return 'new';
  if (agent.lastStatus === 'failure') return 'failure';
  if (!meta) return 'ok';
  return agent.ageMinutes > meta.staleThresholdMin ? 'stale' : 'ok';
}

const HEALTH_STYLES: Record<Health, { bg: string; border: string; text: string; label: string }> = {
  ok:      { bg: 'bg-green-50',  border: 'border-l-green-500',  text: 'text-green-700',  label: 'OK'      },
  stale:   { bg: 'bg-yellow-50', border: 'border-l-yellow-500', text: 'text-yellow-700', label: 'STALE'   },
  new:     { bg: 'bg-gray-50',   border: 'border-l-gray-400',   text: 'text-gray-600',   label: 'SIN DATOS' },
  failure: { bg: 'bg-red-50',    border: 'border-l-red-500',    text: 'text-red-700',    label: 'FAILURE' },
};

const SYSTEM_HEALTH_BADGE: Record<WorldState['systemHealth'], { bg: string; text: string; emoji: string; label: string }> = {
  healthy:  { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅', label: 'Healthy'  },
  degraded: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '⚠️', label: 'Degraded' },
  critical: { bg: 'bg-red-100',    text: 'text-red-700',    emoji: '🚨', label: 'Critical' },
};

export default function HealthPage() {
  const [state, setState]   = useState<WorldState | null>(null);
  const [cortex, setCortex] = useState<CortexConfig | null>(null);
  const [orch, setOrch]     = useState<OrchestratorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [snapshotAgeSec, setSnapshotAgeSec] = useState(0);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stateRes, cortexRes, orchRes] = await Promise.all([
        fetch(`${CEREBRO_URL}/cerebro/state`,    { cache: 'no-store' }),
        fetch(`${MYCORTEX_URL}/mycortex/config`, { cache: 'no-store' }),
        fetch(`${ORCH_URL}/orchestrator/status`, { cache: 'no-store' }),
      ]);
      if (!stateRes.ok)  throw new Error(`cerebro ${stateRes.status}`);
      if (!cortexRes.ok) throw new Error(`mycortex ${cortexRes.status}`);
      if (!orchRes.ok)   throw new Error(`orchestrator ${orchRes.status}`);

      setState((await stateRes.json())  as WorldState);
      setCortex((await cortexRes.json()) as CortexConfig);
      setOrch((await orchRes.json())    as OrchestratorStatus);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  // Ticker en vivo de la edad del snapshot — alerta visual si está muy stale.
  useEffect(() => {
    if (!state) return;
    const tick = () => {
      const age = Math.floor((Date.now() - new Date(state.generatedAt).getTime()) / 1000);
      setSnapshotAgeSec(age);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state]);

  const stats = useMemo(() => {
    if (!state) return { ok: 0, stale: 0, neww: 0, fail: 0 };
    let ok = 0, stale = 0, neww = 0, fail = 0;
    for (const a of state.agents) {
      const c = classifyAgent(a);
      if (c === 'ok') ok++;
      else if (c === 'stale') stale++;
      else if (c === 'new') neww++;
      else fail++;
    }
    return { ok, stale, neww, fail };
  }, [state]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🩺 Cerebro — Salud operativa</h1>
          <p className="text-sm text-gray-500">
            Estado de gates + frescura de cada publisher. Refresh automático cada 30s.
            Sirve para detectar a primera vista si algo está stuck sin escarbar curl.
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

      {state && cortex && orch && (
        <>
          {/* ─── Sistema overview ───────────────────────── */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-5 rounded-2xl ${SYSTEM_HEALTH_BADGE[state.systemHealth].bg}`}>
              <div className="text-xs text-gray-600 mb-1">System health</div>
              <div className={`text-2xl font-black ${SYSTEM_HEALTH_BADGE[state.systemHealth].text}`}>
                {SYSTEM_HEALTH_BADGE[state.systemHealth].emoji} {SYSTEM_HEALTH_BADGE[state.systemHealth].label}
              </div>
              <div className="text-xs text-gray-500 mt-3">
                Snapshot generado hace {formatAge(snapshotAgeSec)}{' '}
                {snapshotAgeSec > 900 && <span className="text-red-600 font-bold">⚠ stale!</span>}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Frescura publishers</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <FreshnessBadge label="OK"        value={stats.ok}    color="green" />
                <FreshnessBadge label="STALE"     value={stats.stale} color="yellow" />
                <FreshnessBadge label="SIN DATOS" value={stats.neww}  color="gray" />
                <FreshnessBadge label="FAILURE"   value={stats.fail}  color="red" />
              </div>
            </div>
          </div>

          {/* ─── Master switches ───────────────────────── */}
          <div className="mb-6 p-5 rounded-2xl bg-white border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Master switches</h2>
            <p className="text-xs text-gray-500 mb-4">
              Si alguno está OFF, las acciones del Cerebro no se ejecutan.
              Los dos primeros son env vars del service (cambiar via gcloud /
              cloudbuild); MyCortex enabled también respeta toggle en /admin/cerebro/config.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SwitchCard
                label="MyCortex reasoning"
                desc={cortex.enabled
                  ? 'Razona cada 30 min'
                  : 'Apagado — cron salta cada ciclo'}
                on={cortex.enabled}
                detail={cortex.pollIntervalMin ? `interval ${cortex.pollIntervalMin}min` : 'default 30min'}
              />
              <SwitchCard
                label="Orchestrator execute"
                desc={orch.executeEnabled
                  ? 'Procesa intenciones de MyCortex'
                  : 'Dormant — solo registra decisiones'}
                on={orch.executeEnabled}
                detail={`max Cat ${orch.maxAutoLevel}`}
              />
              <SwitchCard
                label="Cats activos"
                desc={orch.activeCats.length === 0
                  ? 'Ninguno — el master switch está OFF'
                  : `Cat ${orch.activeCats.join(' + ')} auto-ejecutan`}
                on={orch.activeCats.length > 0}
                detail={`Cat 3 ack-only ${orch.maxAutoLevel >= 3 ? '(activable)' : '(bloqueada)'}`}
              />
            </div>
          </div>

          {/* ─── Tabla de publishers ───────────────────────── */}
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Publishers — frescura por agente</h2>
                <p className="text-xs text-gray-500">
                  Threshold STALE = 4× el intervalo natural del cron. Si lo supera,
                  probablemente el agent perdió env var, su cron paró, o falló de fondo.
                </p>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-2 text-left">Agent</th>
                  <th className="px-5 py-2 text-left">Cron esperado</th>
                  <th className="px-5 py-2 text-left">Threshold stale</th>
                  <th className="px-5 py-2 text-left">Última corrida</th>
                  <th className="px-5 py-2 text-left">Status</th>
                  <th className="px-5 py-2 text-left">Salud</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {state.agents.map((agent) => {
                  const meta = AGENT_META[agent.agentId];
                  const health = classifyAgent(agent);
                  const style = HEALTH_STYLES[health];
                  return (
                    <tr key={agent.agentId} className={`${style.bg}`}>
                      <td className="px-5 py-3">
                        <span className="text-xl mr-2">{meta?.emoji ?? '🤖'}</span>
                        <span className="font-mono font-bold">{agent.agentId}</span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600">
                        {meta?.expectedCron ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 font-mono">
                        {meta ? formatMinutes(meta.staleThresholdMin) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono">
                        {agent.lastRunAt
                          ? `hace ${formatMinutes(agent.ageMinutes)}`
                          : <span className="text-gray-500 italic">nunca</span>}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono">
                        {agent.lastStatus}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold border-l-4 ${style.border} ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ─── Lessons learned hint ────────────────────── */}
          <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <strong>Cómo leer esta página:</strong>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong>OK</strong>: agente publicando dentro de su ventana esperada — normal.</li>
              <li><strong>STALE</strong>: lleva más que su threshold sin publicar.
                Probable causa: env var perdida tras redeploy, cron stuck, o falla silenciosa.
                Fix: <code className="font-mono bg-white px-1 rounded">gcloud run jobs|services describe</code>
                {' '}para ver env vars + logs.
              </li>
              <li><strong>SIN DATOS</strong>: nunca publicó. Normal en agents nuevos (mobile, frontend
                hasta que Sentry/Vercel keys se configuren) o si el cron natural aún no firó.
              </li>
              <li><strong>FAILURE</strong>: el último ciclo terminó en error. Ver logs del agent.</li>
            </ul>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function SwitchCard({ label, desc, on, detail }: { label: string; desc: string; on: boolean; detail?: string }) {
  return (
    <div className={`p-4 rounded-xl border-2 ${on ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-gray-900 text-sm">{label}</div>
        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${on ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {on ? 'ON' : 'OFF'}
        </span>
      </div>
      <div className="text-xs text-gray-700">{desc}</div>
      {detail && <div className="text-xs text-gray-500 font-mono mt-2">{detail}</div>}
    </div>
  );
}

function FreshnessBadge({ label, value, color }: { label: string; value: number; color: 'green'|'yellow'|'gray'|'red' }) {
  const colorClasses: Record<typeof color, string> = {
    green:  'text-green-700',
    yellow: 'text-yellow-700',
    gray:   'text-gray-600',
    red:    'text-red-700',
  };
  return (
    <div>
      <div className={`text-3xl font-black ${colorClasses[color]}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function formatAge(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  return `${h}h ${min % 60}min`;
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h${min % 60 ? ` ${min % 60}min` : ''}`;
  const d = Math.floor(h / 24);
  return `${d}d${h % 24 ? ` ${h % 24}h` : ''}`;
}
