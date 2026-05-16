'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout, StatCard } from '../../components';

// ─── Tipos ─────────────────────────────────────────────────────
//
// agent-bridge-service expone GET /agents:
//   {
//     total: number,
//     agents: [
//       { agentId, kind: 'cloud-run-job' | 'http-service', target: string }
//     ]
//   }

interface AgentEntry {
  agentId: string;
  kind:    'cloud-run-job' | 'http-service';
  target:  string;
}

interface AgentsResponse {
  total:  number;
  agents: AgentEntry[];
}

const BRIDGE_URL =
  process.env.NEXT_PUBLIC_AGENT_BRIDGE_URL ||
  'https://agent-bridge-service-780842550857.us-central1.run.app';

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

export default function AgentsPage() {
  const [data, setData]       = useState<AgentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BRIDGE_URL}/agents`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`agent-bridge ${res.status}`);
      const json = (await res.json()) as AgentsResponse;
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

  const grouped = useMemo(() => {
    const out: Record<'cloud-run-job' | 'http-service', AgentEntry[]> = {
      'cloud-run-job': [],
      'http-service':  [],
    };
    for (const a of data?.agents ?? []) {
      out[a.kind].push(a);
    }
    return out;
  }, [data]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🤖 Agent Registry</h1>
          <p className="text-sm text-gray-500">
            Agentes que el Orchestrator puede invocar via{' '}
            <code className="font-mono bg-gray-100 px-1 rounded text-xs">agent-bridge-service</code>.
            Lectura solamente — para registrar nuevos, editar{' '}
            <code className="font-mono bg-gray-100 px-1 rounded text-xs">
              agent-bridge-service/src/infrastructure/agent-registry.ts
            </code>.
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatCard
          title="Total registrados"
          value={(data?.total ?? 0).toString()}
          icon="🤖"
        />
        <StatCard
          title="Cron Jobs"
          value={grouped['cloud-run-job'].length.toString()}
          icon="⏰"
        />
        <StatCard
          title="HTTP Services"
          value={grouped['http-service'].length.toString()}
          icon="🌐"
        />
      </div>

      {!loading && data && data.total === 0 && (
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
              {list.map((a) => (
                <div
                  key={a.agentId}
                  className={`p-4 rounded-xl bg-white border-2 border-gray-100 border-l-4 ${style.border} flex items-center justify-between gap-3 flex-wrap`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-bold text-gray-900">
                      {a.agentId}
                    </span>
                  </div>
                  <code className="text-xs font-mono text-gray-500 truncate max-w-[60%]" title={a.target}>
                    {a.target}
                  </code>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="mt-8 p-4 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
        <strong>Cómo agregar un agent nuevo:</strong>
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>
            Si es cron job: agregalo a{' '}
            <code className="font-mono bg-white px-1 rounded text-xs">AGENT_REGISTRY</code> con{' '}
            <code className="font-mono bg-white px-1 rounded text-xs">kind: 'cloud-run-job'</code>
            {' '}+ <code className="font-mono bg-white px-1 rounded text-xs">jobName</code>.
          </li>
          <li>
            Si es HTTP service: agregalo con{' '}
            <code className="font-mono bg-white px-1 rounded text-xs">kind: 'http-service'</code>
            {' '}+ <code className="font-mono bg-white px-1 rounded text-xs">serviceUrl</code> +{' '}
            <code className="font-mono bg-white px-1 rounded text-xs">commandPath</code>, y exponé un
            endpoint POST que acepte <code className="font-mono bg-white px-1 rounded text-xs">{`{ decisionId, action, payload }`}</code>.
          </li>
          <li>
            Agregá las reglas correspondientes en{' '}
            <a href="/cerebro/rules" className="underline font-medium">/cerebro/rules</a>{' '}
            apuntando a este agentId.
          </li>
        </ol>
      </div>
    </AdminLayout>
  );
}
