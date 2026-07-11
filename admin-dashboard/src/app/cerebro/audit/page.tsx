'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminLayout, StatCard } from '../../components';

interface AuditEntry {
  changedBy:       string;
  changedAt:       string;
  changedFields:   string[];
  snapshotBefore?: Record<string, any>;
  snapshotAfter:   Record<string, any>;
}

interface AuditResponse {
  count: number;
  audit: AuditEntry[];
}

const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';

const FIELD_LABELS: Record<string, string> = {
  systemPrompt:    'Prompt',
  model:           'Modelo',
  maxTokens:       'Max tokens',
  pollIntervalMin: 'Intervalo',
  enabled:         'Enabled',
};

const authHeaders = (): Record<string, string> => ({
  Authorization:
    'Bearer ' + (typeof window !== 'undefined' ? (localStorage.getItem('authToken') || '') : ''),
});

export default function AuditPage() {
  const [data, setData]       = useState<AuditResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${MYCORTEX_URL}/mycortex/config/audit?limit=100`, { cache: 'no-store', headers: { ...authHeaders() } });
      if (!res.ok) throw new Error(`mycortex ${res.status}`);
      const json = (await res.json()) as AuditResponse;
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

  const uniqueAuthors = new Set(data?.audit.map(a => a.changedBy) ?? []).size;
  const last24hCount = (data?.audit ?? []).filter(a =>
    Date.now() - new Date(a.changedAt).getTime() < 24 * 3600 * 1000,
  ).length;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📜 Audit log — config changes</h1>
          <p className="text-sm text-gray-500">
            Historial de cambios a <code className="font-mono bg-gray-100 px-1 rounded text-xs">cortex_config</code>{' '}
            (prompt, modelo, gates). Cada PUT registra una entrada. TTL 180d.
            Para diagnóstico operativo cuando algo del cerebro cambió de comportamiento sin explicación.
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
        <StatCard title="Cambios registrados" value={(data?.count ?? 0).toString()} icon="📜" />
        <StatCard title="Últimas 24h"          value={last24hCount.toString()}      icon="🕐" />
        <StatCard title="Autores distintos"    value={uniqueAuthors.toString()}     icon="👤" />
      </div>

      {!loading && data && data.audit.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 text-center">
          <div className="text-5xl mb-3">📜</div>
          <p className="text-gray-600">
            Sin cambios registrados todavía. Cada vez que alguien guarde en{' '}
            <Link href="/cerebro/config" className="text-orange-600 hover:text-orange-700 underline">
              /cerebro/config
            </Link>{' '}
            aparecerá acá.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(data?.audit ?? []).map((entry, idx) => {
          const key = `${entry.changedAt}-${idx}`;
          const isExpanded = expanded === key;
          return (
            <div
              key={key}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : key)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
              >
                <span className="text-2xl">📝</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-semibold text-gray-900 font-mono">
                      {entry.changedBy}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.changedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {entry.changedFields.map(f => (
                      <span key={f} className="px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 text-xs font-mono">
                        {FIELD_LABELS[f] ?? f}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400">{isExpanded ? '▾' : '▸'}</span>
              </button>

              {isExpanded && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3 text-xs">
                  {entry.changedFields.map(field => (
                    <DiffRow
                      key={field}
                      label={FIELD_LABELS[field] ?? field}
                      before={entry.snapshotBefore?.[field]}
                      after={entry.snapshotAfter[field]}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900">
        <strong>Para qué sirve:</strong>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Si MyCortex de pronto deja de razonar bien → ver acá si alguien tocó el prompt.</li>
          <li>Si los costos de Anthropic suben → ver si cambió el modelo o maxTokens.</li>
          <li>Si los ciclos cambian de frecuencia → ver si cambió pollIntervalMin.</li>
          <li>Si el reasoning loop se apagó → ver si <code className="font-mono">enabled</code> se setteó false.</li>
        </ul>
      </div>
    </AdminLayout>
  );
}

function DiffRow({ label, before, after }: { label: string; before: any; after: any }) {
  const renderValue = (v: any) => {
    if (v === undefined || v === null) return <span className="italic text-gray-400">(empty)</span>;
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    if (typeof v === 'number') return String(v);
    if (typeof v === 'string') {
      if (v.length > 120) {
        return (
          <details>
            <summary className="cursor-pointer text-orange-600 hover:text-orange-700">
              {v.length} chars (expandir)
            </summary>
            <pre className="mt-1 p-2 bg-white border border-gray-200 rounded font-mono whitespace-pre-wrap">{v}</pre>
          </details>
        );
      }
      return <span className="font-mono">{v}</span>;
    }
    return <pre className="font-mono">{JSON.stringify(v, null, 2)}</pre>;
  };

  return (
    <div>
      <div className="text-xs uppercase font-semibold text-gray-500 mb-1">{label}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="p-2 rounded bg-red-50 border border-red-100">
          <div className="text-[10px] uppercase font-bold text-red-600 mb-1">Antes</div>
          <div className="text-gray-800">{renderValue(before)}</div>
        </div>
        <div className="p-2 rounded bg-green-50 border border-green-100">
          <div className="text-[10px] uppercase font-bold text-green-600 mb-1">Después</div>
          <div className="text-gray-800">{renderValue(after)}</div>
        </div>
      </div>
    </div>
  );
}
