'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

// ─── Tipos ─────────────────────────────────────────────────────
//
// Spec del endpoint del orchestrator:
//   GET /orchestrator/rules
//   { total: number, rules: { type: string, rule: ActionRule | 'human_only' }[] }
//
// donde ActionRule = { agent, action, safetyLevel: 1|2|3 }
// y 'human_only' es el literal string que indica que el orchestrator
// solo notifica vía Telegram pero no ejecuta acción automática.

interface ActionRule {
  agent:       string;
  action:      string;
  safetyLevel: 1 | 2 | 3;
}

interface RuleEntry {
  type: string;
  rule: ActionRule | 'human_only';
}

interface RulesResponse {
  total: number;
  rules: RuleEntry[];
}

const ORCH_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ||
  'https://orchestrator-service-780842550857.us-central1.run.app';

// ─── Estilos por safety level ──────────────────────────────────
//
// Cat 1 = info (auto-ejecuta sin notificar)
// Cat 2 = reversible (auto-ejecuta + notifica a Telegram)
// Cat 3 = irreversible (requiere ack humano con timeout 15min)
// human_only = el orchestrator NO ejecuta — solo reporta y opera lo arregla manual
//
// El borde a la izquierda da una "leyenda visual" que se lee de un vistazo.

const SAFETY_STYLES = {
  1: {
    bg:    'bg-blue-50',
    text:  'text-blue-700',
    border:'border-l-blue-500',
    label: 'Cat 1 — info',
    desc:  'Auto-ejecuta sin notificar',
    emoji: '🔵',
  },
  2: {
    bg:    'bg-yellow-50',
    text:  'text-yellow-700',
    border:'border-l-yellow-500',
    label: 'Cat 2 — reversible',
    desc:  'Auto-ejecuta + notifica',
    emoji: '🟡',
  },
  3: {
    bg:    'bg-red-50',
    text:  'text-red-700',
    border:'border-l-red-500',
    label: 'Cat 3 — irreversible',
    desc:  'Requiere ack humano (15 min)',
    emoji: '🔴',
  },
  human_only: {
    bg:    'bg-gray-50',
    text:  'text-gray-600',
    border:'border-l-gray-400',
    label: 'Human-only',
    desc:  'Solo notifica, operador resuelve manual',
    emoji: '👤',
  },
} as const;

type GroupKey = 1 | 2 | 3 | 'human_only';

const authHeaders = (): Record<string, string> => ({
  Authorization:
    'Bearer ' + (typeof window !== 'undefined' ? (localStorage.getItem('authToken') || '') : ''),
});

export default function RulesPage() {
  const [data, setData]       = useState<RulesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ORCH_URL}/orchestrator/rules`, { cache: 'no-store', headers: { ...authHeaders() } });
      if (!res.ok) throw new Error(`orchestrator ${res.status}`);
      const json = (await res.json()) as RulesResponse;
      setData(json);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Agrupamos por safety level. Mantengo el orden Cat1 → Cat2 → Cat3 → human_only
  // porque es como uno mentalmente revisa: lo más automatizado primero,
  // lo más manual al final.
  const grouped = useMemo(() => {
    const out: Record<GroupKey, RuleEntry[]> = {
      1: [],
      2: [],
      3: [],
      human_only: [],
    };
    for (const r of data?.rules ?? []) {
      if (r.rule === 'human_only') {
        out.human_only.push(r);
      } else {
        out[r.rule.safetyLevel].push(r);
      }
    }
    return out;
  }, [data]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">⚙️ Orchestrator — Rules</h1>
          <p className="text-sm text-gray-500">
            Mapeo intentionType → agent.action que MyCortex puede disparar.
            Lectura solamente — para editar, ver{' '}
            <code className="font-mono bg-gray-100 px-1 rounded text-xs">
              orchestrator-service/src/decision/rules-engine.service.ts
            </code>
            .
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

      {/* Stats por safety level */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          title="Cat 1 — info"
          value={grouped[1].length.toString()}
          icon="🔵"
        />
        <StatCard
          title="Cat 2 — reversible"
          value={grouped[2].length.toString()}
          icon="🟡"
        />
        <StatCard
          title="Cat 3 — irreversible"
          value={grouped[3].length.toString()}
          icon="🔴"
        />
        <StatCard
          title="Human-only"
          value={grouped.human_only.length.toString()}
          icon="👤"
        />
      </div>

      {!loading && data && data.total === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">⚙️</div>
          <p className="text-gray-600">
            Sin reglas configuradas. El orchestrator marcará todas las intenciones como
            <span className="font-mono bg-gray-100 px-1 rounded mx-1 text-xs">human_only</span>.
          </p>
        </div>
      )}

      {/* Una sección por nivel — orden Cat1 → Cat2 → Cat3 → human_only */}
      {(['1', '2', '3', 'human_only'] as const).map((k) => {
        const key = k === 'human_only' ? 'human_only' : (Number(k) as 1 | 2 | 3);
        const list = grouped[key as GroupKey];
        if (list.length === 0) return null;
        const style = SAFETY_STYLES[key as keyof typeof SAFETY_STYLES];
        return (
          <section key={String(key)} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{style.emoji}</span>
              <h2 className={`text-lg font-bold ${style.text}`}>{style.label}</h2>
              <span className="text-xs text-gray-500">{style.desc}</span>
              <span className="text-xs text-gray-400 ml-auto font-mono">
                {list.length} {list.length === 1 ? 'regla' : 'reglas'}
              </span>
            </div>

            <div className="space-y-2">
              {list.map((entry) => (
                <RuleCard key={entry.type} entry={entry} style={style} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Hint para los unknowns */}
      <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
        <strong>Ojo:</strong> los <code className="font-mono bg-white px-1 rounded">intentionType</code>
        {' '}que MyCortex emita y NO estén acá caen automáticamente a{' '}
        <span className="font-mono">human_only (unknown)</span> — el orchestrator notifica via Telegram
        y el operador decide. Si ves un type recurrente en{' '}
        <a href="/cerebro/decisions?status=ignored" className="underline font-medium">
          decisiones ignoradas
        </a>{' '}
        que vale la pena automatizar, agregalo al RULES table.
      </div>
    </AdminLayout>
  );
}

function RuleCard({
  entry,
  style,
}: {
  entry: RuleEntry;
  style:  typeof SAFETY_STYLES[keyof typeof SAFETY_STYLES];
}) {
  return (
    <div
      className={`p-4 rounded-xl bg-white border-2 border-gray-100 border-l-4 ${style.border} flex items-center justify-between gap-3 flex-wrap`}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm font-bold text-gray-900">{entry.type}</span>
      </div>
      <div className="text-sm text-gray-600">
        {entry.rule === 'human_only' ? (
          <span className="italic">— solo reporta a Telegram</span>
        ) : (
          <span className="font-mono">
            <span className="text-blue-700">{entry.rule.agent}</span>
            <span className="text-gray-400 mx-1">.</span>
            <span className="text-orange-700">{entry.rule.action}</span>
          </span>
        )}
      </div>
    </div>
  );
}
