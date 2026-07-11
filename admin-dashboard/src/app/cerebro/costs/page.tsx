'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

interface ByDay   { date:  string; cycles: number; tokensIn: number; tokensOut: number; costUsd: number }
interface ByModel { model: string; cycles: number; tokensIn: number; tokensOut: number; costUsd: number }

interface CostStats {
  windowDays:            number;
  totalCycles:           number;
  byDay:                 ByDay[];
  byModel:               ByModel[];
  // Item 4 — tokens y costos reales del ciclo (post 2026-05-12)
  totalRealTokensIn?:    number;
  totalRealTokensOut?:   number;
  totalCacheReadTokens?: number;
  totalActualCostUsd?:   number;
  cyclesWithRealCost?:   number;
}

const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';

// ─── Estimación de costo por ciclo, por modelo ────────────────
//
// Cada ciclo de MyCortex envía:
//   - system prompt: ~5k tokens cacheados (90% descuento aprox)
//   - user prompt:   ~3k tokens uncacheado
//   - output:        ~2k tokens
//
// Precios Anthropic (USD por 1M tokens, Mayo 2026 — ajustar si cambian):
//   sonnet-4-5: $3 input / $15 output (con cache: input cached = $0.30)
//   opus-4-5:   $15 input / $75 output (cache cached = $1.50)
//   haiku-4-5:  $0.80 input / $4 output (cache cached = $0.08)
//
// Tokens estimados por ciclo:
//   - input cached:    5000 (system prompt)
//   - input uncached:  3000 (user prompt)
//   - output:          2000

const TOKENS_PER_CYCLE = {
  inputCached:   5000,
  inputUncached: 3000,
  output:        2000,
};

const MODEL_PRICES_PER_1M: Record<string, { inputCached: number; inputUncached: number; output: number; label: string }> = {
  'claude-sonnet-4-5': { inputCached: 0.30, inputUncached: 3,    output: 15,   label: 'Claude Sonnet 4.5' },
  'claude-opus-4-5':   { inputCached: 1.50, inputUncached: 15,   output: 75,   label: 'Claude Opus 4.5'   },
  'claude-haiku-4-5':  { inputCached: 0.08, inputUncached: 0.80, output: 4,    label: 'Claude Haiku 4.5'  },
  unknown:             { inputCached: 0.30, inputUncached: 3,    output: 15,   label: 'unknown (Sonnet est.)' },
};

function costPerCycle(model: string): number {
  const p = MODEL_PRICES_PER_1M[model] ?? MODEL_PRICES_PER_1M.unknown;
  return (
    (TOKENS_PER_CYCLE.inputCached   / 1_000_000) * p.inputCached +
    (TOKENS_PER_CYCLE.inputUncached / 1_000_000) * p.inputUncached +
    (TOKENS_PER_CYCLE.output        / 1_000_000) * p.output
  );
}

const authHeaders = (): Record<string, string> => ({
  Authorization:
    'Bearer ' + (typeof window !== 'undefined' ? (localStorage.getItem('authToken') || '') : ''),
});

export default function CostsPage() {
  const [data, setData] = useState<CostStats | null>(null);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${MYCORTEX_URL}/mycortex/cost-stats?days=${days}`, { cache: 'no-store', headers: { ...authHeaders() } });
      if (!res.ok) throw new Error(`mycortex ${res.status}`);
      setData((await res.json()) as CostStats);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const computed = useMemo(() => {
    if (!data) return null;
    // ¿Tenemos costos reales para TODOS los ciclos? Si sí, mostramos solo real.
    // Si parcial (algunos pre-Item4, otros post), híbrido: real para los nuevos
    // + estimación para los viejos. Si nada real, todo estimado.
    const realCycles = data.cyclesWithRealCost ?? 0;
    const totalCycles = data.totalCycles;
    const hasRealAll  = realCycles === totalCycles && totalCycles > 0;
    const hasRealAny  = realCycles > 0;

    // Costos por modelo: si hay real en el row, lo usamos; si no, estimación.
    const byModelWithCost = data.byModel.map(m => {
      const realCost = m.costUsd ?? 0;
      const estCost  = m.cycles * costPerCycle(m.model);
      // Híbrido: real para los ciclos con tokens + estimación para los sin
      const cyclesWithReal = m.tokensIn > 0 ? m.cycles : 0; // approximation
      const finalCost = realCost > 0 ? realCost : estCost;
      const source: 'real' | 'estimate' = realCost > 0 ? 'real' : 'estimate';
      return {
        ...m,
        cost:        finalCost,
        perCycle:    finalCost / Math.max(1, m.cycles),
        source,
      };
    });

    const totalCost = byModelWithCost.reduce((s, m) => s + m.cost, 0);
    const dailyAvg = data.windowDays > 0 ? totalCost / data.windowDays : 0;
    const monthlyProj = dailyAvg * 30;

    return {
      totalCost,
      dailyAvg,
      monthlyProj,
      byModelWithCost,
      hasRealAll,
      hasRealAny,
      realCycles,
      totalCycles,
    };
  }, [data]);

  // Para el bar chart de cycles by day, normalizamos
  const maxDayCycles = data ? Math.max(1, ...data.byDay.map(d => d.cycles)) : 1;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💸 MyCortex — Costos estimados</h1>
          <p className="text-sm text-gray-500">
            Llamadas a Anthropic estimadas por ventana. La aproximación asume{' '}
            ~5k input cached + 3k uncached + 2k output por ciclo.
            Los números reales pueden variar ±20% según size del world snapshot
            (que crece cuando hay más anomalías).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as 7 | 30 | 90)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
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

      {data && computed && (
        <>
          {/* Badge fidelidad de la medición */}
          <div className={`mb-4 p-3 rounded-lg border text-sm ${
            computed.hasRealAll
              ? 'bg-green-50 border-green-200 text-green-900'
              : computed.hasRealAny
              ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            {computed.hasRealAll && (
              <><strong>💎 Costos reales:</strong> {computed.realCycles}/{computed.totalCycles} ciclos con
                tokens persistidos. Cifras exactas basadas en <code className="font-mono bg-white px-1 rounded">usage.input_tokens / output_tokens</code> de Anthropic.</>
            )}
            {!computed.hasRealAll && computed.hasRealAny && (
              <><strong>🔀 Híbrido:</strong> {computed.realCycles}/{computed.totalCycles} ciclos con costo real,
                el resto estimación (~±20%). Ciclos previos a Item 4 (2026-05-12) no tienen tokens persistidos
                — los siguientes ya sí.</>
            )}
            {!computed.hasRealAny && (
              <><strong>📐 Estimación:</strong> Sin tokens persistidos en la ventana. Asume ~5k cached + 3k uncached
                + 2k output por ciclo (tolerancia ±20%). Los ciclos nuevos post-Item-4 traerán datos exactos.</>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard
              title="Ciclos en ventana"
              value={data.totalCycles.toLocaleString()}
              icon="🧠"
            />
            <StatCard
              title={computed.hasRealAll ? 'Costo real' : 'Costo (parcial real)'}
              value={`$${computed.totalCost.toFixed(2)}`}
              icon="💰"
            />
            <StatCard
              title="Promedio diario"
              value={`$${computed.dailyAvg.toFixed(3)}`}
              icon="📊"
            />
            <StatCard
              title="Proyección mensual"
              value={`$${computed.monthlyProj.toFixed(2)}`}
              icon="📅"
            />
          </div>

          {/* Token usage real cuando lo tenemos */}
          {computed.hasRealAny && data.totalRealTokensIn !== undefined && (
            <div className="mb-6 p-4 rounded-xl bg-white border border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Tokens IN total</div>
                <div className="font-mono font-bold text-gray-900">{(data.totalRealTokensIn ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Tokens OUT total</div>
                <div className="font-mono font-bold text-gray-900">{(data.totalRealTokensOut ?? 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Cache READ tokens</div>
                <div className="font-mono font-bold text-green-700">{(data.totalCacheReadTokens ?? 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {data.totalRealTokensIn && data.totalCacheReadTokens
                    ? `${((data.totalCacheReadTokens / data.totalRealTokensIn) * 100).toFixed(0)}% hit rate`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-semibold">Costo real exacto</div>
                <div className="font-mono font-bold text-gray-900">${(data.totalActualCostUsd ?? 0).toFixed(4)}</div>
              </div>
            </div>
          )}

          {/* Cycles per day bar chart */}
          <div className="mb-6 p-5 rounded-2xl bg-white border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Ciclos por día</h2>
            {data.byDay.length === 0 ? (
              <p className="text-xs text-gray-500">Sin ciclos en la ventana.</p>
            ) : (
              <div className="space-y-1">
                {data.byDay.map(d => (
                  <div key={d.date} className="flex items-center gap-2 text-xs">
                    <span className="w-24 font-mono text-gray-600">{d.date}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-orange-400 rounded-full transition-all"
                        style={{ width: `${(d.cycles / maxDayCycles) * 100}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-gray-900">{d.cycles}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By model */}
          <div className="mb-6 p-5 rounded-2xl bg-white border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Breakdown por modelo</h2>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="text-left pb-2">Modelo</th>
                  <th className="text-right pb-2">Ciclos</th>
                  <th className="text-right pb-2">$/ciclo</th>
                  <th className="text-right pb-2">Costo total</th>
                  <th className="text-right pb-2">Fuente</th>
                  <th className="text-right pb-2">% del total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {computed.byModelWithCost.map(row => {
                  const price = MODEL_PRICES_PER_1M[row.model] ?? MODEL_PRICES_PER_1M.unknown;
                  const pct = computed.totalCost > 0 ? (row.cost / computed.totalCost) * 100 : 0;
                  return (
                    <tr key={row.model}>
                      <td className="py-2">
                        <div className="font-mono text-gray-900">{row.model}</div>
                        <div className="text-xs text-gray-500">{price.label}</div>
                      </td>
                      <td className="py-2 text-right font-mono">{row.cycles}</td>
                      <td className="py-2 text-right font-mono text-gray-600">${row.perCycle.toFixed(4)}</td>
                      <td className="py-2 text-right font-mono font-bold">${row.cost.toFixed(2)}</td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          row.source === 'real'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {row.source === 'real' ? '💎 real' : '📐 estimado'}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-600">{pct.toFixed(0)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
            <strong>Cómo se calcula:</strong>
            <ul className="list-disc ml-5 mt-2 space-y-1 text-xs">
              <li>Cada cycleId distinto en <code className="font-mono bg-white px-1 rounded">mycortex_intentions</code>{' '}
                = 1 llamada a Anthropic.</li>
              <li>Tokens estimados: 5000 input cached (system prompt) + 3000 input fresh (user) + 2000 output.</li>
              <li>Precios usados (USD/1M tokens, mayo 2026):
                <code className="ml-1 font-mono bg-white px-1 rounded text-[10px]">
                  Sonnet $3in/$15out · Opus $15in/$75out · Haiku $0.80in/$4out
                </code>
              </li>
              <li>Estimación tolerancia ±20%. Para precisión exacta hay que persistir
                <code className="font-mono bg-white px-1 rounded mx-1">tokensIn/tokensOut</code>
                en cada intention (TODO próximo: extender el schema).
              </li>
              <li>No incluye Cloud Run runtime ni Pub/Sub messages — costos chicos
                comparados con Anthropic.</li>
            </ul>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
