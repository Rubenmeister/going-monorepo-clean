'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

// ─── Tipos ─────────────────────────────────────────────────────

interface ByType {
  type:          string;
  count:         number;
  avgUrgency:    number;
  executedCount: number;
}

interface ByOutcome {
  outcome: string;
  count:   number;
}

interface ByStatus {
  status: string;
  count:  number;
}

interface MemoryRollup {
  weekStarting:    string;
  weekEnding:      string;
  totalIntentions: number;
  byType:          ByType[];
  byOutcome:       ByOutcome[];
  byStatus:        ByStatus[];
  byModel:         Array<{ model: string; count: number }>;
  summary:         string;
  generatedAt?:    string;
}

interface RollupsResponse {
  count:   number;
  rollups: MemoryRollup[];
}

const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';

const STATUS_COLORS: Record<string, string> = {
  executed:  'bg-green-200',
  proposed:  'bg-blue-200',
  expired:   'bg-gray-300',
  ignored:   'bg-yellow-200',
  rejected:  'bg-red-200',
};

const OUTCOME_COLORS: Record<string, string> = {
  effective:        'bg-green-500',
  partial:          'bg-yellow-400',
  ineffective:      'bg-red-400',
  counterproductive:'bg-red-600',
  unknown:          'bg-gray-400',
};

export default function MemoryPage() {
  const [data, setData]       = useState<RollupsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${MYCORTEX_URL}/mycortex/rollups?limit=12`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`mycortex ${res.status}`);
      const json = (await res.json()) as RollupsResponse;
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const regenerateCurrent = async () => {
    setRegenerating(true);
    try {
      await fetch(`${MYCORTEX_URL}/mycortex/rollups/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      setTimeout(load, 1000);
    } catch (e) {
      setError(`Regenerate failed: ${(e as Error).message}`);
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const aggregateStats = useMemo(() => {
    if (!data || data.rollups.length === 0) {
      return { weeks: 0, totalIntentions: 0, topType: '—', execRatePct: 0 };
    }
    const totalIntentions = data.rollups.reduce((s, r) => s + r.totalIntentions, 0);
    const typeMap = new Map<string, number>();
    let totalExecuted = 0;
    for (const r of data.rollups) {
      for (const t of r.byType) {
        typeMap.set(t.type, (typeMap.get(t.type) ?? 0) + t.count);
      }
      totalExecuted += r.byStatus.find(s => s.status === 'executed')?.count ?? 0;
    }
    let topType = '—', topCount = 0;
    for (const [type, count] of typeMap.entries()) {
      if (count > topCount) {
        topType = type;
        topCount = count;
      }
    }
    return {
      weeks:           data.rollups.length,
      totalIntentions,
      topType,
      execRatePct: totalIntentions > 0 ? Math.round((totalExecuted / totalIntentions) * 100) : 0,
    };
  }, [data]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📚 MyCortex — Memoria estratégica</h1>
          <p className="text-sm text-gray-500">
            Rollups semanales de intenciones. Generado automático domingo 23:55 EC.
            MyCortex incluye los últimos 4 en su prompt para detectar patrones recurrentes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={regenerateCurrent}
            disabled={regenerating}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium"
          >
            {regenerating ? 'Regenerando…' : '🔄 Regenerar semana actual'}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Semanas con datos"   value={aggregateStats.weeks.toString()}                icon="📅" />
        <StatCard title="Total intenciones"   value={aggregateStats.totalIntentions.toString()}      icon="💡" />
        <StatCard title="Type top recurrente" value={aggregateStats.topType.replace(/_/g, ' ')}      icon="🎯" />
        <StatCard title="Tasa ejecución"      value={`${aggregateStats.execRatePct}%`}               icon="✅" />
      </div>

      {!loading && data && data.rollups.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">📚</div>
          <p className="text-gray-600">
            Sin rollups todavía.{' '}
            <button
              onClick={regenerateCurrent}
              className="text-orange-600 hover:text-orange-700 font-medium underline"
            >
              Regenerar manual la semana actual
            </button>{' '}
            o esperar al cron del domingo 23:55 EC.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(data?.rollups ?? []).map((rollup) => (
          <RollupCard key={rollup.weekStarting} rollup={rollup} />
        ))}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
        <strong>Cómo funciona:</strong>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Cada domingo 23:55 EC, MemoryRollupService corre. Lee intenciones de la semana,
              agrupa por type, outcome, status, model.</li>
          <li>Genera un <code className="font-mono bg-white px-1 rounded">summary</code> programático
              de 1-2 líneas que se inyecta en el system prompt de MyCortex.</li>
          <li>MyCortex usa eso para calibrar urgency en próximos ciclos
              ("si el type X se ejecutó effective 3 semanas seguidas, puedo bajar urgency").</li>
          <li>Regenerar manual: útil para preview del rollup actual antes del domingo,
              o para backfill si el cron falló.</li>
        </ul>
      </div>
    </AdminLayout>
  );
}

function RollupCard({ rollup }: { rollup: MemoryRollup }) {
  const weekStart = new Date(rollup.weekStarting).toISOString().slice(0, 10);
  const weekEnd   = new Date(rollup.weekEnding).toISOString().slice(0, 10);
  const totalForStatusChart = rollup.byStatus.reduce((s, x) => s + x.count, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold mb-0.5">Semana</div>
          <div className="font-bold text-lg text-gray-900">
            {weekStart} → {weekEnd}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-gray-900">{rollup.totalIntentions}</div>
          <div className="text-xs text-gray-500">intenciones totales</div>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-4 italic">{rollup.summary}</p>

      {totalForStatusChart > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Status breakdown</div>
          <div className="flex w-full h-3 rounded-full overflow-hidden border border-gray-100">
            {rollup.byStatus.map(s => {
              const pct = (s.count / totalForStatusChart) * 100;
              return (
                <div
                  key={s.status}
                  className={STATUS_COLORS[s.status] ?? 'bg-gray-200'}
                  style={{ width: `${pct}%` }}
                  title={`${s.status}: ${s.count} (${pct.toFixed(0)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
            {rollup.byStatus.map(s => (
              <span key={s.status} className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-sm ${STATUS_COLORS[s.status] ?? 'bg-gray-200'}`} />
                {s.status}: <strong>{s.count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {rollup.byOutcome && rollup.byOutcome.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Outcome breakdown (de Etapa B feedback)</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {rollup.byOutcome.map(o => (
              <span key={o.outcome} className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-sm ${OUTCOME_COLORS[o.outcome] ?? 'bg-gray-200'}`} />
                {o.outcome}: <strong>{o.count}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {rollup.byType.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Top types ({rollup.byType.length})</div>
          <div className="space-y-1.5">
            {rollup.byType.slice(0, 5).map(t => (
              <div key={t.type} className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-gray-900 w-64 truncate">{t.type}</span>
                <span className="text-gray-500">{t.count}×</span>
                <span className="text-gray-400 font-mono">avg urg {t.avgUrgency.toFixed(2)}</span>
                <span className="text-green-700 font-medium">exec {t.executedCount}</span>
              </div>
            ))}
            {rollup.byType.length > 5 && (
              <div className="text-xs text-gray-400 italic">…{rollup.byType.length - 5} más</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
