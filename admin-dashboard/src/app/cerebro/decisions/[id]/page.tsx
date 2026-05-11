'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AdminLayout } from '../../../components';

// ─── Tipos ─────────────────────────────────────────────────────

interface Decision {
  decisionId:        string;
  intentionId:       string;
  intentionType:     string;
  intentionUrgency?: number;
  agentId?:          string;
  action?:           string;
  args?:             Record<string, unknown>;
  safetyLevel?:      1 | 2 | 3;
  status:            string;
  humanOnlyReason?:  string;
  dormantReason?:    string;
  expiresAt?:        string;
  approvedAt?:       string;
  approvedBy?:       string;
  rejectedAt?:       string;
  rejectedBy?:       string;
  rejectionReason?:  string;
  executedAt?:       string;
  outcome?:          'success' | 'failure' | 'unknown';
  outcomeData?:      Record<string, unknown>;
  errorMessage?:     string;
  createdReceivedAt: string;
  createdAt?:        string;
  updatedAt?:        string;
}

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
  status:            string;
  outcome:           string;
  outcomeNotes?:     string;
  outcomeRecordedAt?:string;
  acknowledgedAt?:   string;
  acknowledgedBy?:   string;
  receivedAt:        string;
}

const ORCH_URL =
  process.env.NEXT_PUBLIC_ORCHESTRATOR_URL ||
  'https://orchestrator-service-780842550857.us-central1.run.app';
const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';

const STATUS_BADGE: Record<string, { bg: string; text: string; emoji: string }> = {
  proposed:         { bg: 'bg-blue-100',    text: 'text-blue-700',    emoji: '📋' },
  pending_approval: { bg: 'bg-orange-100',  text: 'text-orange-700',  emoji: '⏳' },
  approved:         { bg: 'bg-green-100',   text: 'text-green-700',   emoji: '✓'  },
  executing:        { bg: 'bg-yellow-100',  text: 'text-yellow-700',  emoji: '⚙️' },
  executed:         { bg: 'bg-green-100',   text: 'text-green-700',   emoji: '✅' },
  rejected:         { bg: 'bg-red-100',     text: 'text-red-700',     emoji: '❌' },
  expired:          { bg: 'bg-gray-100',    text: 'text-gray-600',    emoji: '⏰' },
  ignored:          { bg: 'bg-gray-100',    text: 'text-gray-600',    emoji: '⊘'  },
  dormant:          { bg: 'bg-purple-100',  text: 'text-purple-700',  emoji: '😴' },
};

const SAFETY_BADGE: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Cat 1 — info, auto-ejecuta' },
  2: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Cat 2 — reversible, auto+notify' },
  3: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Cat 3 — irreversible, requiere ack' },
};

export default function DecisionDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [decision, setDecision] = useState<Decision | null>(null);
  const [intention, setIntention] = useState<Intention | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const decRes = await fetch(`${ORCH_URL}/orchestrator/decisions/${id}`, { cache: 'no-store' });
      if (!decRes.ok) throw new Error(`orchestrator ${decRes.status}`);
      const decJson = (await decRes.json()) as Decision | { error: string };
      if ('error' in decJson) throw new Error(decJson.error);
      setDecision(decJson);

      // Side fetch: la intention madre (best-effort)
      if (decJson.intentionId) {
        const intRes = await fetch(`${MYCORTEX_URL}/mycortex/intentions/${decJson.intentionId}`, { cache: 'no-store' }).catch(() => null);
        if (intRes && intRes.ok) {
          const intJson = (await intRes.json()) as Intention | { error: string };
          if (!('error' in intJson)) setIntention(intJson);
        }
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
        <Link href="/cerebro/decisions" className="text-sm text-orange-600 hover:text-orange-700">
          ← Volver a decisiones
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}

      {loading && <div className="text-gray-500">Cargando…</div>}

      {decision && (
        <>
          {/* Header */}
          <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <span className={`px-3 py-1 rounded-md text-sm font-bold ${STATUS_BADGE[decision.status]?.bg ?? 'bg-gray-100'} ${STATUS_BADGE[decision.status]?.text ?? 'text-gray-700'}`}>
                  {STATUS_BADGE[decision.status]?.emoji ?? '?'} {decision.status}
                </span>
                {decision.safetyLevel && (
                  <span className={`px-3 py-1 rounded-md text-sm font-medium ${SAFETY_BADGE[decision.safetyLevel].bg} ${SAFETY_BADGE[decision.safetyLevel].text}`}>
                    {SAFETY_BADGE[decision.safetyLevel].label}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{decision.intentionType}</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">decision: {decision.decisionId}</p>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Recibida {new Date(decision.createdReceivedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</div>
            </div>
          </div>

          {/* Acción decidida */}
          {decision.agentId && (
            <Section title="Acción decidida">
              <div className="font-mono text-sm">
                <span className="text-blue-700">{decision.agentId}</span>
                <span className="text-gray-400 mx-1">.</span>
                <span className="text-orange-700">{decision.action}</span>
              </div>
              {decision.args && Object.keys(decision.args).length > 0 && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                    Args ({Object.keys(decision.args).length} campos)
                  </summary>
                  <pre className="mt-2 p-3 rounded bg-gray-50 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(decision.args, null, 2)}
                  </pre>
                </details>
              )}
            </Section>
          )}

          {/* Why dormant / ignored */}
          {decision.status === 'dormant' && decision.dormantReason && (
            <Section title="Por qué quedó dormant">
              <div className="text-sm text-purple-700 bg-purple-50 p-3 rounded-lg">
                {decision.dormantReason === 'execute_disabled' && (
                  <>Master switch <code className="font-mono bg-white px-1 rounded">ORCHESTRATOR_EXECUTE_ENABLED=false</code>.
                    Para activar: <code className="font-mono bg-white px-1 rounded">bash scripts/cerebro/activate-orchestrator.sh 1</code></>
                )}
                {decision.dormantReason.startsWith('above_auto_level:') && (
                  <>Cat {decision.safetyLevel} requiere <code className="font-mono bg-white px-1 rounded">MAX_AUTO_LEVEL ≥ {decision.safetyLevel}</code>.
                    Actual: {decision.dormantReason.split(':')[1] || '0'}.</>
                )}
              </div>
            </Section>
          )}
          {decision.status === 'ignored' && decision.humanOnlyReason && (
            <Section title="Por qué quedó ignored">
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg font-mono">
                {decision.humanOnlyReason}
              </div>
            </Section>
          )}

          {/* Outcome */}
          {decision.status === 'executed' && (
            <Section title="Outcome">
              <div className={`p-3 rounded-lg text-sm ${decision.outcome === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <strong>{decision.outcome}</strong>
                {decision.executedAt && (
                  <span className="ml-3 text-xs">ejecutada {new Date(decision.executedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</span>
                )}
              </div>
              {decision.outcomeData && Object.keys(decision.outcomeData).length > 0 && (
                <pre className="mt-3 p-3 rounded bg-gray-50 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(decision.outcomeData, null, 2)}
                </pre>
              )}
              {decision.errorMessage && (
                <div className="mt-3 p-3 rounded bg-red-50 text-red-700 text-xs">
                  Error: {decision.errorMessage}
                </div>
              )}
            </Section>
          )}

          {/* Cat 3 approval lifecycle */}
          {(decision.approvedAt || decision.rejectedAt || decision.expiresAt) && (
            <Section title="Approval lifecycle">
              <div className="space-y-2 text-sm">
                {decision.expiresAt && decision.status === 'pending_approval' && (
                  <div className="text-orange-700">
                    Vence {new Date(decision.expiresAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
                  </div>
                )}
                {decision.approvedAt && (
                  <div className="text-green-700">
                    ✓ Aprobada por {decision.approvedBy} en {new Date(decision.approvedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
                  </div>
                )}
                {decision.rejectedAt && (
                  <div className="text-red-700">
                    ❌ Rechazada por {decision.rejectedBy} en {new Date(decision.rejectedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
                    {decision.rejectionReason && <div className="mt-1 text-xs">Motivo: {decision.rejectionReason}</div>}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Intention madre */}
          <Section title="Intention madre (MyCortex)">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <Link
                href={`/cerebro/intentions/${decision.intentionId}`}
                className="text-sm text-orange-600 hover:text-orange-700 font-mono"
              >
                intention: {decision.intentionId} →
              </Link>
              {decision.intentionUrgency !== undefined && (
                <span className="text-xs text-gray-600 font-mono">
                  urgency {decision.intentionUrgency.toFixed(2)}
                </span>
              )}
            </div>
            {intention ? (
              <>
                <div className="text-sm font-medium text-gray-900 mb-1">{intention.reason}</div>
                <div className="text-xs text-gray-600">Acción sugerida: {intention.suggestedAction}</div>
                <div className="text-xs text-gray-500 mt-2 font-mono">
                  cycle: {intention.cycleId.slice(0, 8)} · model: {intention.modelUsed} · target: {intention.target ?? '—'}
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Intention no encontrada en MyCortex (posible expirada y purgada).
              </div>
            )}
          </Section>

          {/* Raw JSON */}
          <Section title="Decision raw JSON (debug)">
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Mostrar
              </summary>
              <pre className="mt-2 p-3 rounded bg-gray-50 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(decision, null, 2)}
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
