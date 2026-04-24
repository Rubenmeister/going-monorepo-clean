'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

type StepStatus = 'completed' | 'in_progress' | 'pending' | 'failed';

interface OnboardingStep {
  key: string; label: string;
  status: StepStatus; completedAt?: string; notes?: string;
}

interface DriverOnboarding {
  id: string; name: string; email: string; phone?: string;
  city?: string; vehicleType?: string;
  registeredAt: string; lastActivity?: string;
  steps: OnboardingStep[];
  completionPct: number;
  estimatedEarnings?: number;
  reminderSent?: boolean;
}

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function adminPost(token: string, path: string, body: any) {
  try {
    await fetch(`${API}${path}`, { method:'POST', headers: { Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body:JSON.stringify(body) });
  } catch {}
}

const STEP_DEFINITIONS = [
  { key:'registro',     label:'Registro básico',       icon:'📝', desc:'Datos personales completos' },
  { key:'documentos',   label:'Documentos subidos',    icon:'📄', desc:'Cédula, licencia, SOAT' },
  { key:'verificacion', label:'Verificación aprobada', icon:'✅', desc:'Revisión del equipo Going' },
  { key:'capacitacion', label:'Capacitación online',   icon:'🎓', desc:'Módulos de servicio y seguridad' },
  { key:'primer_viaje', label:'Primer viaje',          icon:'🚗', desc:'Primer viaje completado' },
];


const STEP_COLORS: Record<StepStatus, { bg: string; text: string; border: string }> = {
  completed:   { bg:'#f0fdf4', text:'#16a34a', border:'#86efac' },
  in_progress: { bg:'#eff6ff', text:'#2563eb', border:'#93c5fd' },
  pending:     { bg:'#f9fafb', text:'#9ca3af', border:'#e5e7eb' },
  failed:      { bg:'#fef2f2', text:'#dc2626', border:'#fca5a5' },
};
const STEP_ICONS_STATUS: Record<StepStatus, string> = {
  completed:'✅', in_progress:'🔄', pending:'○', failed:'❌',
};

function timeAgo(iso: string) {
  const h = Math.floor((Date.now()-new Date(iso).getTime())/3600000);
  if (h < 1) return 'hace <1h';
  if (h < 24) return `hace ${h}h`;
  return `hace ${Math.floor(h/24)}d`;
}

export default function OnboardingPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const [drivers,   setDrivers]   = useState<DriverOnboarding[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState<DriverOnboarding | null>(null);
  const [filter,    setFilter]    = useState<'all' | 'blocked' | 'active' | 'completed'>('all');
  const [toastMsg,  setToastMsg]  = useState('');

  const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(''), 3000); };

  const fetchData = useCallback(async () => {
    const data = await safeGet<any>(token, '/auth/admin/users?status=onboarding&limit=100');
    const raw: any[] = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
    setDrivers(raw);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function approveStep(driverId: string, stepKey: string) {
    await adminPost(token, `/auth/admin/drivers/${driverId}/onboarding/${stepKey}/approve`, {});
    setDrivers(prev => prev.map(d => d.id === driverId ? {
      ...d,
      steps: d.steps.map(s => s.key === stepKey ? { ...s, status:'completed' as StepStatus, completedAt: new Date().toISOString() } : s),
      completionPct: Math.min(100, d.completionPct + 20),
    } : d));
    if (selected?.id === driverId) setSelected(prev => prev ? { ...prev, steps: prev.steps.map(s => s.key === stepKey ? { ...s, status:'completed' as StepStatus } : s) } : null);
    toast('Paso aprobado');
  }

  async function sendReminder(driverId: string, name: string) {
    await adminPost(token, `/notifications/send`, { userId: driverId, type:'onboarding_reminder' });
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, reminderSent:true } : d));
    toast(`Recordatorio enviado a ${name}`);
  }

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando onboarding…" />;

  const completed  = drivers.filter(d => d.completionPct === 100).length;
  const blocked    = drivers.filter(d => d.steps.some(s => s.status === 'failed')).length;
  const inProgress = drivers.filter(d => d.completionPct > 0 && d.completionPct < 100 && !d.steps.some(s => s.status === 'failed')).length;

  const filtered = drivers.filter(d => {
    if (filter === 'completed') return d.completionPct === 100;
    if (filter === 'blocked')   return d.steps.some(s => s.status === 'failed');
    if (filter === 'active')    return d.completionPct > 0 && d.completionPct < 100 && !d.steps.some(s => s.status === 'failed');
    return true;
  });

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {toastMsg && <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toastMsg}</div>}

      {/* Driver detail panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="font-bold text-lg text-gray-900">{selected.name}</h3>
                <p className="text-sm text-gray-500">{selected.city} · {selected.vehicleType}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 flex-1 space-y-5">

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700">Progreso de onboarding</span>
                  <span className="font-black text-blue-600">{selected.completionPct}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width:`${selected.completionPct}%` }} />
                </div>
              </div>

              {/* Earnings preview */}
              {selected.estimatedEarnings && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
                  <span className="text-3xl">💰</span>
                  <div>
                    <p className="font-bold text-green-800">Ingresos estimados al completar</p>
                    <p className="text-2xl font-black text-green-600">${selected.estimatedEarnings}<span className="text-sm font-normal text-green-500">/mes</span></p>
                  </div>
                </div>
              )}

              {/* Steps */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pasos del onboarding</p>
                {selected.steps.map((step, i) => {
                  const cfg = STEP_COLORS[step.status];
                  const stepDef = STEP_DEFINITIONS.find(s => s.key === step.key);
                  return (
                    <div key={step.key} className="rounded-xl border p-4" style={{ backgroundColor:cfg.bg, borderColor:cfg.border }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{stepDef?.icon}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{step.label}</p>
                            <p className="text-xs text-gray-500">{stepDef?.desc}</p>
                            {step.completedAt && <p className="text-xs text-green-600 mt-0.5">✓ {timeAgo(step.completedAt)}</p>}
                            {step.notes && <p className="text-xs text-red-600 mt-0.5">⚠ {step.notes}</p>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color:cfg.text, backgroundColor:'white', border:`1px solid ${cfg.border}` }}>
                            {STEP_ICONS_STATUS[step.status]} {step.status === 'completed' ? 'Listo' : step.status === 'in_progress' ? 'En curso' : step.status === 'failed' ? 'Bloqueado' : 'Pendiente'}
                          </span>
                          {(step.status === 'in_progress' || step.status === 'failed') && (
                            <button onClick={() => approveStep(selected.id, step.key)}
                              className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                              ✓ Aprobar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Contact info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contacto</p>
                <p>{selected.email}</p>
                {selected.phone && <p>{selected.phone}</p>}
                <p className="text-xs text-gray-400">Registrado {timeAgo(selected.registeredAt)}</p>
                {selected.lastActivity && <p className="text-xs text-gray-400">Última actividad {timeAgo(selected.lastActivity)}</p>}
              </div>
            </div>

            <div className="p-6 border-t">
              <button onClick={() => sendReminder(selected.id, selected.name)}
                disabled={selected.reminderSent}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 transition-colors">
                {selected.reminderSent ? '✓ Recordatorio ya enviado' : '📱 Enviar recordatorio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onboarding de Conductores</h1>
          <p className="text-sm text-gray-500 mt-1">{drivers.length} conductores en proceso · {completed} completados</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { label:'En proceso',  value:inProgress, color:'#2563eb', icon:'🔄', key:'active' as const },
          { label:'Bloqueados',  value:blocked,    color:'#dc2626', icon:'❌', key:'blocked' as const },
          { label:'Completados', value:completed,  color:'#16a34a', icon:'✅', key:'completed' as const },
          { label:'Total',       value:drivers.length, color:'#6b7280', icon:'👥', key:'all' as const },
        ].map(k => (
          <button key={k.key} onClick={() => setFilter(filter === k.key ? 'all' : k.key)}
            className={`bg-white rounded-2xl border p-5 shadow-sm text-left transition-all hover:shadow-md ${filter === k.key ? 'ring-2' : ''}`}
            style={{ '--tw-ring-color': k.color } as any}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{k.icon}</span>
              <span className="text-xs text-gray-500 font-medium">{k.label}</span>
            </div>
            <p className="text-3xl font-black" style={{ color:k.color }}>{k.value}</p>
          </button>
        ))}
      </div>

      {/* Driver grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(d => {
          const isBlocked = d.steps.some(s => s.status === 'failed');
          const currentStep = d.steps.find(s => s.status === 'in_progress' || s.status === 'failed');
          const stepDef = currentStep ? STEP_DEFINITIONS.find(s => s.key === currentStep.key) : null;
          const pctColor = d.completionPct === 100 ? '#16a34a' : isBlocked ? '#dc2626' : '#2563eb';
          return (
            <div key={d.id} onClick={() => setSelected(d)}
              className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer hover:shadow-md transition-all ${isBlocked ? 'border-red-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.city} · {d.vehicleType ?? 'Vehículo'}</p>
                </div>
                {d.reminderSent && <span className="text-xs text-blue-500 flex-shrink-0 font-medium">📱 Reminder</span>}
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Progreso</span>
                  <span className="font-bold" style={{ color:pctColor }}>{d.completionPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width:`${d.completionPct}%`, backgroundColor:pctColor }} />
                </div>
              </div>

              {/* Step dots */}
              <div className="flex gap-1.5 mb-3">
                {d.steps.map(s => {
                  const c = STEP_COLORS[s.status];
                  return <div key={s.key} className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: c.text }} />;
                })}
              </div>

              {/* Current step */}
              {currentStep && stepDef && (
                <div className={`text-xs px-3 py-1.5 rounded-lg font-medium ${isBlocked ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                  {stepDef.icon} {isBlocked ? `Bloqueado: ${currentStep.notes ?? currentStep.label}` : `En curso: ${currentStep.label}`}
                </div>
              )}
              {d.completionPct === 100 && (
                <div className="text-xs px-3 py-1.5 rounded-lg font-medium bg-green-50 text-green-700">✅ Onboarding completo · Listo para operar</div>
              )}

              <p className="text-xs text-gray-400 mt-3">Registrado {timeAgo(d.registeredAt)}</p>
            </div>
          );
        })}
      </div>

    </AdminLayout>
  );
}
