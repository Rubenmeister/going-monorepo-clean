'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '../../../components';

interface Intention {
  intentionId:       string;
  cycleId:           string;
  type:              string;
  urgency:           number;
  target?:           string;
  reason:            string;
  suggestedAction:   string;
  expiresAt?:        string;
  data?:             Record<string, unknown>;
  modelUsed:         string;
  worldSnapshotGeneratedAt?: number;
  status:            string;
  outcome:           string;
  outcomeNotes?:     string;
  outcomeRecordedAt?:string;
  acknowledgedAt?:   string;
  acknowledgedBy?:   string;
  receivedAt:        string;
}

interface DecisionLite {
  decisionId:   string;
  intentionId:  string;
  status:       string;
  safetyLevel?: number;
  outcome?:     string;
  agentId?:     string;
  action?:      string;
}

const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';
const ORCH_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ||
  'https://orchestrator-service-780842550857.us-central1.run.app';

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  proposed:     { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  acknowledged: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  executed:     { bg: 'bg-green-100',  text: 'text-green-700'  },
  rejected:     { bg: 'bg-red-100',    text: 'text-red-700'    },
  expired:      { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

const OUTCOME_BADGE: Record<string, { bg: string; text: string }> = {
  effective:        { bg: 'bg-green-100',  text: 'text-green-700'  },
  partial:          { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  ineffective:      { bg: 'bg-red-100',    text: 'text-red-700'    },
  counterproductive:{ bg: 'bg-red-200',    text: 'text-red-800'    },
  unknown:          { bg: 'bg-gray-100',   text: 'text-gray-600'   },
};

const authHeaders = (): Record<string, string> => ({
  Authorization:
    'Bearer ' + (typeof window !== 'undefined' ? (localStorage.getItem('authToken') || '') : ''),
});

export default function IntentionDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [intention, setIntention] = useState<Intention | null>(null);
  const [relatedDecision, setRelatedDecision] = useState<DecisionLite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const intRes = await fetch(`${MYCORTEX_URL}/mycortex/intentions/${id}`, { cache: 'no-store', headers: { ...authHeaders() } });
      if (!intRes.ok) throw new Error(`mycortex ${intRes.status}`);
      const intJson = (await intRes.json()) as Intention | { error: string };
      if ('error' in intJson) throw new Error(intJson.error);
      setIntention(intJson);

      // Side fetch: ¿hay una decision asociada? Listamos recientes y filtramos.
      const decsRes = await fetch(`${ORCH_URL}/orchestrator/decisions?limit=200`, { cache: 'no-store', headers: { ...authHeaders() } }).catch(() => null);
      if (decsRes && decsRes.ok) {
        const decsJson = (await decsRes.json()) as { decisions: DecisionLite[] };
        const match = decsJson.decisions.find(d => d.intentionId === id);
        if (match) setRelatedDecision(match);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  return (
    <AdminLayout>
      <div className="mb-4">
        <Link href="/cerebro/intentions" className="text-sm text-orange-600 hover:text-orange-700">
          ← Volver a intenciones
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {loading && <div className="text-gray-500">Cargando…</div>}

      {intention && (
        <>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className={`px-3 py-1 rounded-md text-sm font-bold ${STATUS_BADGE[intention.status]?.bg ?? 'bg-gray-100'} ${STATUS_BADGE[intention.status]?.text ?? 'text-gray-700'}`}>
                  {intention.status}
                </span>
                <span className={`px-3 py-1 rounded-md text-sm font-medium ${OUTCOME_BADGE[intention.outcome]?.bg ?? 'bg-gray-100'} ${OUTCOME_BADGE[intention.outcome]?.text ?? 'text-gray-700'}`}>
                  outcome: {intention.outcome}
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 text-xs font-mono">
                  urg {intention.urgency.toFixed(2)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{intention.type}</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">intention: {intention.intentionId}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>{new Date(intention.receivedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</div>
              <div className="font-mono mt-1">cycle {intention.cycleId.slice(0, 8)}</div>
            </div>
          </div>

          {/* Razonamiento */}
          <Section title="Razonamiento de MyCortex">
            <div className="text-sm text-gray-800 whitespace-pre-wrap">{intention.reason}</div>
          </Section>

          {/* Acción sugerida */}
          <Section title="Acción sugerida">
            <div className="text-sm text-gray-800 whitespace-pre-wrap">{intention.suggestedAction}</div>
            {intention.target && (
              <div className="mt-3 text-xs text-gray-600">
                <strong>Target:</strong> <span className="font-mono">{intention.target}</span>
              </div>
            )}
          </Section>

          {/* Data fields */}
          {intention.data && Object.keys(intention.data).length > 0 && (
            <Section title="Data context">
              <pre className="p-3 rounded bg-gray-50 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(intention.data, null, 2)}
              </pre>
            </Section>
          )}

          {/* Outcome feedback */}
          {intention.outcome !== 'unknown' && (
            <Section title="Outcome feedback (Etapa B loop)">
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Outcome:</strong>{' '}
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${OUTCOME_BADGE[intention.outcome]?.bg} ${OUTCOME_BADGE[intention.outcome]?.text}`}>
                    {intention.outcome}
                  </span>
                </div>
                {intention.acknowledgedBy && (
                  <div className="text-xs text-gray-600">
                    Reportado por <span className="font-mono">{intention.acknowledgedBy}</span>
                    {intention.acknowledgedAt && (
                      <> en {new Date(intention.acknowledgedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</>
                    )}
                  </div>
                )}
                {intention.outcomeNotes && (
                  <div className="p-3 rounded bg-gray-50 text-xs font-mono whitespace-pre-wrap">
                    {intention.outcomeNotes}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Decision asociada */}
          <Section title="Decision del Orchestrator">
            {relatedDecision ? (
              <Link
                href={`/cerebro/decisions/${relatedDecision.decisionId}`}
                className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-orange-600">{relatedDecision.decisionId.slice(0, 8)}</span>
                  <span className="px-2 py-0.5 rounded bg-white text-xs font-bold">{relatedDecision.status}</span>
                  {relatedDecision.safetyLevel && (
                    <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs">
                      Cat {relatedDecision.safetyLevel}
                    </span>
                  )}
                  {relatedDecision.outcome && (
                    <span className={`px-2 py-0.5 rounded text-xs ${relatedDecision.outcome === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      outcome: {relatedDecision.outcome}
                    </span>
                  )}
                </div>
                {relatedDecision.agentId && relatedDecision.action && (
                  <div className="text-xs font-mono text-gray-600">
                    {relatedDecision.agentId}.{relatedDecision.action}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">Click para ver detalle →</div>
              </Link>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Sin decision registrada. Puede ser que MyCortex emitió esta intention recientemente y el
                orchestrator todavía no la procesó (poll cada 5min), o la intention todavía está en estado
                proposed sin acción correspondiente en RULES.
              </div>
            )}
          </Section>

          {/* Metadata */}
          <Section title="Metadata">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-gray-500 uppercase font-semibold mb-1">Modelo</div>
                <div className="font-mono">{intention.modelUsed}</div>
              </div>
              <div>
                <div className="text-gray-500 uppercase font-semibold mb-1">Cycle ID</div>
                <div className="font-mono">{intention.cycleId}</div>
              </div>
              {intention.expiresAt && (
                <div>
                  <div className="text-gray-500 uppercase font-semibold mb-1">Expira</div>
                  <div className="font-mono">{new Date(intention.expiresAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</div>
                </div>
              )}
              {intention.worldSnapshotGeneratedAt && (
                <div>
                  <div className="text-gray-500 uppercase font-semibold mb-1">World snapshot</div>
                  <div className="font-mono">{new Date(intention.worldSnapshotGeneratedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</div>
                </div>
              )}
            </div>
          </Section>

          {/* Raw JSON */}
          <Section title="Raw JSON (debug)">
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">Mostrar</summary>
              <pre className="mt-2 p-3 rounded bg-gray-50 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(intention, null, 2)}
              </pre>
            </details>
          </Section>
        </>
      )}
    </AdminLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 p-5 rounded-2xl bg-white border border-gray-200">
      <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}
