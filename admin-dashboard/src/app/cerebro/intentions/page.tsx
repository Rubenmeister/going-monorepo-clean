'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout } from '../../components';

interface Intention {
  intentionId: string;
  cycleId: string;
  type: string;
  urgency: number;
  target?: string;
  reason: string;
  suggestedAction: string;
  expiresAt?: string;
  status: 'proposed' | 'acknowledged' | 'executed' | 'rejected' | 'expired';
  outcome?: string;
  modelUsed: string;
  receivedAt: string;
  data?: Record<string, unknown>;
}

const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';

type Filter = 'pending' | 'all';

const STATUS_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  proposed:     { bg: 'bg-blue-100',   text: 'text-blue-700',   emoji: '💡' },
  acknowledged: { bg: 'bg-yellow-100', text: 'text-yellow-700', emoji: '👁️' },
  executed:     { bg: 'bg-green-100',  text: 'text-green-700',  emoji: '✅' },
  rejected:     { bg: 'bg-gray-100',   text: 'text-gray-600',   emoji: '❌' },
  expired:      { bg: 'bg-gray-100',   text: 'text-gray-500',   emoji: '⏰' },
};

export default function IntentionsPage() {
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [filter, setFilter] = useState<Filter>('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const path = filter === 'pending' ? 'intentions' : 'intentions/all';
      const res = await fetch(`${MYCORTEX_URL}/mycortex/${path}?limit=50`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`mycortex-service ${res.status}`);
      const json = (await res.json()) as { intentions: Intention[] };
      setIntentions(json.intentions || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const triggerRunNow = async () => {
    setRunning(true);
    try {
      await fetch(`${MYCORTEX_URL}/mycortex/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      // dale 3 segundos para que persista y refresca
      setTimeout(load, 3000);
    } catch (e) {
      setError(`Run-now falló: ${(e as Error).message}`);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 60 * 1000); // refresh cada 60s
    return () => clearInterval(id);
  }, [filter]);

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💡 MyCortex — Intenciones</h1>
          <p className="text-sm text-gray-500">
            Propuestas IA generadas por MyCortex cada 30 min, ordenadas por urgencia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as Filter)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium"
          >
            <option value="pending">Solo pendientes</option>
            <option value="all">Todas</option>
          </select>
          <button
            onClick={triggerRunNow}
            disabled={running}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {running ? 'Ejecutando…' : '🧠 Run now'}
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

      {!loading && intentions.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">🧠</div>
          <p className="text-gray-600">
            {filter === 'pending'
              ? 'Sin intenciones pendientes. MyCortex no detectó nada que requiera atención.'
              : 'Sin intenciones registradas.'}
          </p>
          <button
            onClick={triggerRunNow}
            className="mt-4 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium"
          >
            Disparar un ciclo ahora
          </button>
        </div>
      )}

      <div className="space-y-3">
        {intentions.map((intent) => {
          const status = STATUS_STYLES[intent.status] || STATUS_STYLES.proposed;
          const expired =
            intent.expiresAt && new Date(intent.expiresAt).getTime() < Date.now();
          return (
            <Link
              key={intent.intentionId}
              href={`/cerebro/intentions/${intent.intentionId}`}
              className={`block p-5 rounded-2xl border-2 transition ${
                expired ? 'border-gray-200 bg-gray-50 opacity-60 hover:opacity-80' : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-sm'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <UrgencyBadge urgency={intent.urgency} />
                  <span className="font-mono text-sm font-bold text-gray-900">
                    {intent.type}
                  </span>
                  {intent.target && (
                    <span className="text-xs text-gray-600 font-mono px-2 py-0.5 rounded bg-gray-100">
                      → {intent.target}
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-md font-medium ${status.bg} ${status.text}`}
                  >
                    {status.emoji} {intent.status}
                  </span>
                </div>
                <div className="text-right text-xs text-gray-500 flex-shrink-0">
                  <div>{relativeTime(intent.receivedAt)}</div>
                  {intent.expiresAt && (
                    <div className={expired ? 'text-red-600' : 'text-orange-600'}>
                      vence{' '}
                      {new Date(intent.expiresAt).toLocaleString('es-EC', {
                        timeZone: 'America/Guayaquil',
                        hour: '2-digit',
                        minute: '2-digit',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Razón</div>
                  <p className="text-sm text-gray-800">{intent.reason}</p>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
                    Acción sugerida
                  </div>
                  <p className="text-sm text-gray-800">{intent.suggestedAction}</p>
                </div>
                {intent.data && Object.keys(intent.data).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                      Datos adicionales
                    </summary>
                    <pre className="mt-2 p-2 rounded bg-gray-50 text-xs font-mono overflow-x-auto">
                      {JSON.stringify(intent.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Modelo: {intent.modelUsed}</span>
                <span className="font-mono">
                  cycle: {intent.cycleId.slice(0, 8)}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminLayout>
  );
}

function UrgencyBadge({ urgency }: { urgency: number }) {
  let bg = 'bg-gray-100';
  let text = 'text-gray-700';
  let label = 'baja';
  if (urgency >= 0.8) {
    bg = 'bg-red-100';
    text = 'text-red-700';
    label = 'crítica';
  } else if (urgency >= 0.5) {
    bg = 'bg-orange-100';
    text = 'text-orange-700';
    label = 'alta';
  } else if (urgency >= 0.3) {
    bg = 'bg-yellow-100';
    text = 'text-yellow-700';
    label = 'media';
  }
  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${bg} ${text}`}>
      {urgency.toFixed(2)} · {label}
    </span>
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
