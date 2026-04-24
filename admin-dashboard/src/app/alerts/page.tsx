'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import Link from 'next/link';
import { fetchAlerts, Alert, AlertSeverity, AlertCategory } from '../../lib/alerts';

/* ─── Config ────────────────────────────────────────────────────────────── */
const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; bg: string; border: string; icon: string }> = {
  critical: { label: 'Crítica',   color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200',    icon: '🔴' },
  warning:  { label: 'Advertencia', color: 'text-amber-700', bg: 'bg-amber-50',   border: 'border-amber-200',  icon: '🟡' },
  info:     { label: 'Info',      color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200',   icon: '🔵' },
};

const CATEGORY_CONFIG: Record<AlertCategory, { label: string; icon: string }> = {
  documentos:  { label: 'Documentos',  icon: '📄' },
  pagos:       { label: 'Pagos',       icon: '💳' },
  calidad:     { label: 'Calidad',     icon: '⭐' },
  corporativo: { label: 'Corporativo', icon: '🏢' },
  usuarios:    { label: 'Usuarios',    icon: '👤' },
  vehiculos:   { label: 'Vehículos',   icon: '🚗' },
};

const DISMISS_KEY = 'going_admin_dismissed_alerts';

function getDismissed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DISMISS_KEY) ?? '[]')); }
  catch { return new Set(); }
}
function saveDismissed(ids: Set<string>) {
  localStorage.setItem(DISMISS_KEY, JSON.stringify([...ids].slice(-200)));
}

/* ─── Components ────────────────────────────────────────────────────────── */
function AlertCard({ alert, onDismiss }: { alert: Alert; onDismiss: (id: string) => void }) {
  const sev = SEVERITY_CONFIG[alert.severity];
  const cat = CATEGORY_CONFIG[alert.category];
  const age = Math.abs(Math.round((Date.now() - new Date(alert.detectedAt).getTime()) / 60000));
  const ageLabel = age < 60 ? `hace ${age} min` : age < 1440 ? `hace ${Math.round(age/60)}h` : `hace ${Math.round(age/1440)}d`;

  return (
    <div className={`rounded-2xl border p-4 flex gap-4 items-start ${sev.bg} ${sev.border}`}>
      <div className="flex-shrink-0 text-2xl mt-0.5">{sev.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border ${sev.border} ${sev.color}`}>
            {sev.label}
          </span>
          <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
            {cat.icon} {cat.label}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{ageLabel}</span>
        </div>
        <p className={`text-sm font-semibold ${sev.color}`}>{alert.title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
        <div className="flex items-center gap-3 mt-3">
          <Link href={alert.link}
            className={`text-xs font-semibold underline ${sev.color} hover:opacity-70`}>
            Ver y resolver →
          </Link>
          <button onClick={() => onDismiss(alert.id)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ✕ Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="text-6xl mb-4">✅</div>
      <p className="text-xl font-bold text-gray-600">Todo en orden</p>
      <p className="text-sm mt-2 text-center max-w-sm">
        No hay alertas activas en este momento. El dashboard se actualiza cada 5 minutos.
      </p>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function AlertsPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [alerts,    setAlerts]    = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading,   setLoading]   = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [filterSev, setFilterSev] = useState<AlertSeverity | ''>('');
  const [filterCat, setFilterCat] = useState<AlertCategory | ''>('');
  const [showDismissed, setShowDismissed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAlerts(token);
    setAlerts(result);
    setDismissed(getDismissed());
    setLastFetch(new Date());
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, [load]);

  function dismiss(id: string) {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  }

  function dismissAll(ids: string[]) {
    setDismissed(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      saveDismissed(next);
      return next;
    });
  }

  function restoreAll() {
    setDismissed(new Set());
    localStorage.removeItem(DISMISS_KEY);
  }

  const visible   = alerts.filter(a => !dismissed.has(a.id));
  const discarded = alerts.filter(a => dismissed.has(a.id));

  const filtered = visible.filter(a =>
    (!filterSev || a.severity === filterSev) &&
    (!filterCat || a.category === filterCat)
  );

  const criticals = visible.filter(a => a.severity === 'critical');
  const warnings  = visible.filter(a => a.severity === 'warning');
  const infos     = visible.filter(a => a.severity === 'info');

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Analizando sistema..." />;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            🔔 Centro de Alertas
            {criticals.length > 0 && (
              <span className="text-base px-2.5 py-0.5 rounded-full bg-red-600 text-white font-bold animate-pulse">
                {criticals.length}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastFetch ? `Última actualización: ${lastFetch.toLocaleTimeString('es-EC')}` : 'Cargando…'}
            {' · '}Se actualiza cada 5 minutos
          </p>
        </div>
        <div className="flex gap-2">
          {visible.length > 0 && (
            <button onClick={() => dismissAll(visible.map(a => a.id))}
              className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
              Descartar todas
            </button>
          )}
          <button onClick={load}
            className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50">
            ↺ Actualizar
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Críticas',      count: criticals.length, cfg: SEVERITY_CONFIG.critical },
          { label: 'Advertencias',  count: warnings.length,  cfg: SEVERITY_CONFIG.warning  },
          { label: 'Informativas',  count: infos.length,     cfg: SEVERITY_CONFIG.info     },
        ].map(s => (
          <button key={s.label}
            onClick={() => setFilterSev(filterSev === s.cfg.label.toLowerCase().slice(0,8) as AlertSeverity ? '' : (['critical','warning','info'] as AlertSeverity[])[['Críticas','Advertencias','Informativas'].indexOf(s.label)])}
            className={`rounded-2xl border p-5 text-center shadow-sm transition-all hover:scale-[1.02] ${s.cfg.bg} ${s.cfg.border}`}>
            <p className="text-3xl font-black" style={{ lineHeight:1 }}>{s.count}</p>
            <p className={`text-xs font-semibold mt-1 ${s.cfg.color}`}>{s.cfg.icon} {s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      {visible.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex gap-3 flex-wrap shadow-sm">
          <select value={filterSev} onChange={e => setFilterSev(e.target.value as AlertSeverity | '')}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">Todas las severidades</option>
            <option value="critical">🔴 Crítica</option>
            <option value="warning">🟡 Advertencia</option>
            <option value="info">🔵 Info</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value as AlertCategory | '')}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="">Todas las categorías</option>
            {(Object.entries(CATEGORY_CONFIG) as [AlertCategory, {label:string;icon:string}][]).map(([k,v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          {(filterSev || filterCat) && (
            <button onClick={() => { setFilterSev(''); setFilterCat(''); }}
              className="text-sm text-gray-400 hover:text-gray-600 px-2">✕ Limpiar</button>
          )}
          <span className="ml-auto text-xs text-gray-400 self-center">
            {filtered.length} de {visible.length} alerta{visible.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Alert list by category */}
      {visible.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No hay alertas con esos filtros</div>
      ) : (
        <div className="space-y-3">
          {/* Group by category for readability */}
          {(Object.keys(CATEGORY_CONFIG) as AlertCategory[]).map(cat => {
            const group = filtered.filter(a => a.category === cat);
            if (group.length === 0) return null;
            const cfg = CATEGORY_CONFIG[cat];
            return (
              <div key={cat}>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4 flex items-center gap-1.5">
                  {cfg.icon} {cfg.label}
                  <span className="bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-bold">{group.length}</span>
                </p>
                <div className="space-y-2">
                  {group.map(alert => (
                    <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dismissed section */}
      {discarded.length > 0 && (
        <div className="mt-8">
          <button onClick={() => setShowDismissed(p => !p)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 font-medium">
            {showDismissed ? '▼' : '▶'} {discarded.length} alerta{discarded.length>1?'s':''} descartada{discarded.length>1?'s':''}
            <span className="text-xs underline ml-2" onClick={e => { e.stopPropagation(); restoreAll(); }}>Restaurar todas</span>
          </button>
          {showDismissed && (
            <div className="mt-3 space-y-2 opacity-50">
              {discarded.map(a => (
                <div key={a.id} className="rounded-xl border border-gray-200 p-3 flex items-center gap-3 bg-gray-50">
                  <span className="text-lg">{SEVERITY_CONFIG[a.severity].icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600 font-medium truncate">{a.title}</p>
                    <p className="text-xs text-gray-400">{CATEGORY_CONFIG[a.category].icon} {CATEGORY_CONFIG[a.category].label}</p>
                  </div>
                  <button onClick={() => {
                    setDismissed(prev => { const n=new Set(prev); n.delete(a.id); saveDismissed(n); return n; });
                  }} className="text-xs text-blue-500 hover:underline">Restaurar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </AdminLayout>
  );
}
