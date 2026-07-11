'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components';

// ─── Tipos del response ────────────────────────────────────────

interface ConfigResponse {
  _id:             string;
  systemPrompt:    string;
  model:           string;
  maxTokens:       number | null;
  pollIntervalMin: number | null;
  enabled:         boolean;
  updatedAt:       string | null;
  updatedBy:       string | null;
}

const MYCORTEX_URL =
  process.env.NEXT_PUBLIC_MYCORTEX_URL ||
  'https://mycortex-service-780842550857.us-central1.run.app';

// Modelos soportados por MyCortex hoy. Si admin pone otra cosa el AnthropicClient
// puede caer al default — la UI restringe a estos.
const SUPPORTED_MODELS = [
  { value: '',                      label: '(default)' },
  { value: 'claude-sonnet-4-5',     label: 'Claude Sonnet 4.5 (default)' },
  { value: 'claude-opus-4-5',       label: 'Claude Opus 4.5 (más capaz, +$$)' },
  { value: 'claude-haiku-4-5',      label: 'Claude Haiku 4.5 (más rápido, -$$)' },
];

const authHeaders = (): Record<string, string> => ({
  Authorization:
    'Bearer ' + (typeof window !== 'undefined' ? (localStorage.getItem('authToken') || '') : ''),
});

export default function ConfigPage() {
  const [config, setConfig]     = useState<ConfigResponse | null>(null);
  const [defaultPrompt, setDefaultPrompt] = useState<string>('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);

  // Form state — separado del config server para que ediciones sean locales
  // hasta que el operador presione "Guardar". Permite descartar cambios
  // recargando.
  const [formPrompt,   setFormPrompt]   = useState('');
  const [formModel,    setFormModel]    = useState('');
  const [formEnabled,  setFormEnabled]  = useState(true);
  const [formInterval, setFormInterval] = useState<number | ''>('');
  const [formMaxTok,   setFormMaxTok]   = useState<number | ''>('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfgRes, defRes] = await Promise.all([
        fetch(`${MYCORTEX_URL}/mycortex/config`, { cache: 'no-store', headers: { ...authHeaders() } }),
        fetch(`${MYCORTEX_URL}/mycortex/config/default`, { cache: 'no-store', headers: { ...authHeaders() } }),
      ]);
      if (!cfgRes.ok) throw new Error(`mycortex ${cfgRes.status}`);
      const cfg = (await cfgRes.json()) as ConfigResponse;
      setConfig(cfg);
      setFormPrompt(cfg.systemPrompt || '');
      setFormModel(cfg.model || '');
      setFormEnabled(cfg.enabled);
      setFormInterval(cfg.pollIntervalMin ?? '');
      setFormMaxTok(cfg.maxTokens ?? '');
      if (defRes.ok) {
        const def = (await defRes.json()) as { systemPrompt: string };
        setDefaultPrompt(def.systemPrompt || '');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${MYCORTEX_URL}/mycortex/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          systemPrompt:    formPrompt,
          model:           formModel,
          enabled:         formEnabled,
          // Empty string ⇒ no override (envia null para que backend deje el campo unset)
          pollIntervalMin: formInterval === '' ? null : Number(formInterval),
          maxTokens:       formMaxTok === ''   ? null : Number(formMaxTok),
          updatedBy:       'admin-dashboard',
        }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }
      const updated = (await res.json()) as ConfigResponse & { ok: boolean };
      setConfig(updated);
      setFormPrompt(updated.systemPrompt || '');
      setFormModel(updated.model || '');
      setFormEnabled(updated.enabled);
      setFormInterval(updated.pollIntervalMin ?? '');
      setFormMaxTok(updated.maxTokens ?? '');
      setSuccess('Guardado. Cambios entran en vigor en el próximo ciclo (≤60s).');
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Detección de cambios sin guardar — para mostrar warning al operador.
  const dirty =
    config !== null &&
    (formPrompt !== (config.systemPrompt || '') ||
      formModel !== (config.model || '') ||
      formEnabled !== config.enabled ||
      (formInterval === '' ? null : Number(formInterval)) !== config.pollIntervalMin ||
      (formMaxTok   === '' ? null : Number(formMaxTok))   !== config.maxTokens);

  // Validación: prompt mínimo 100 chars cuando no está vacío. Mismo guard
  // que el backend tiene en PromptBuilderService.buildSystemPrompt.
  const promptInvalid =
    formPrompt.length > 0 && formPrompt.length < 100;

  const promptCharCount = formPrompt.length;

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🧠 MyCortex — Config</h1>
          <p className="text-sm text-gray-500">
            System prompt + modelo. Editable en runtime — los cambios entran en vigor en el
            próximo ciclo de razonamiento (max 60s sin redeploy).
          </p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium"
        >
          {loading ? 'Cargando…' : 'Recargar'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          Error: {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
          ✓ {success}
        </div>
      )}

      {!loading && config && (
        <div className="space-y-6">
          {/* Status bar */}
          <div className="p-4 rounded-xl bg-white border border-gray-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span
                className={`px-2 py-1 rounded-md text-xs font-bold ${
                  formEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {formEnabled ? '● Activo' : '○ Pausado'}
              </span>
              <span className="text-xs text-gray-500">
                Última edición: {config.updatedAt
                  ? new Date(config.updatedAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })
                  : '— (nunca editado)'}
                {config.updatedBy && ` por ${config.updatedBy}`}
              </span>
            </div>
            {dirty && (
              <span className="text-xs font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded">
                ⚠ Cambios sin guardar
              </span>
            )}
          </div>

          {/* Toggle enabled */}
          <div className="p-5 rounded-xl bg-white border border-gray-200">
            <h2 className="text-base font-bold text-gray-900 mb-2">Estado</h2>
            <p className="text-sm text-gray-500 mb-3">
              Master switch del razonamiento. Si lo apagas acá, el cron sigue disparando pero salta —
              ningún ciclo se ejecuta hasta que lo reactives.
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formEnabled}
                onChange={(e) => setFormEnabled(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium">
                Reasoning loop activo — MyCortex razona cada 30 min
              </span>
            </label>
          </div>

          {/* Modelo + tuning */}
          <div className="p-5 rounded-xl bg-white border border-gray-200">
            <h2 className="text-base font-bold text-gray-900 mb-2">Modelo y tuning</h2>
            <p className="text-sm text-gray-500 mb-4">
              Sonnet 4.5 es el default — cambia solo si tienes razón concreta (probar Opus en
              eventos críticos, Haiku para cortar costo en runs de baja prioridad).
              Vacío = usa el default del backend.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Modelo</label>
                <select
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                >
                  {SUPPORTED_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Intervalo de razonamiento (min)
                </label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={formInterval}
                  onChange={(e) =>
                    setFormInterval(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="30 (default)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">5–120 min. Vacío = 30.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Max tokens</label>
                <input
                  type="number"
                  min={500}
                  max={8000}
                  value={formMaxTok}
                  onChange={(e) =>
                    setFormMaxTok(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="2500 (default)"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">Máx tokens del response.</p>
              </div>
            </div>
          </div>

          {/* System prompt */}
          <div className="p-5 rounded-xl bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <h2 className="text-base font-bold text-gray-900">System prompt</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono ${
                    promptInvalid ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {promptCharCount} chars{promptInvalid && ' (mín 100 cuando no está vacío)'}
                </span>
                <button
                  onClick={() => setFormPrompt(defaultPrompt)}
                  disabled={!defaultPrompt}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"
                >
                  Cargar default
                </button>
                <button
                  onClick={() => setFormPrompt('')}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  Vaciar
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Vacío = usa el prompt hardcoded en{' '}
              <code className="font-mono bg-gray-100 px-1 rounded text-xs">
                prompt-builder.service.ts
              </code>
              {' '}(safe fallback). Para custom: pega texto y guarda.
            </p>
            <textarea
              value={formPrompt}
              onChange={(e) => setFormPrompt(e.target.value)}
              rows={24}
              spellCheck={false}
              className={`w-full p-3 rounded-lg border font-mono text-xs leading-relaxed ${
                promptInvalid
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
              placeholder="(vacío = default)"
            />
          </div>

          {/* Save bar */}
          <div className="sticky bottom-4 p-4 rounded-xl bg-white border-2 border-gray-200 shadow-lg flex items-center justify-between flex-wrap gap-3">
            <div className="text-sm text-gray-600">
              {dirty
                ? '⚠ Hay cambios sin guardar.'
                : '✓ Sin cambios pendientes.'}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                disabled={!dirty || saving}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                Descartar
              </button>
              <button
                onClick={save}
                disabled={!dirty || saving || promptInvalid}
                className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white text-sm font-medium"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
