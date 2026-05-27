/**
 * Política de Viajes Corporativos
 * Ruta: /empresas/politica
 *
 * Define las reglas que aplican a todos los empleados:
 * límites de gasto, horarios permitidos, servicios habilitados
 * y umbrales de aprobación.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import { corpFetch } from "@/lib/empresas/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface TravelPolicy {
  enabled: boolean;
  maxFarePerTrip: number;
  maxFarePerDay: number;
  maxFarePerMonth: number;
  requireJustificationAbove: number;
  allowedServices: string[];
  allowedDays: number[];          // 0=Dom, 1=Lun … 6=Sáb
  allowedHoursFrom: string;       // "HH:MM"
  allowedHoursTo: string;
  autoApproveBelow: number;
  requireApprovalAbove: number;   // si ≥ maxFarePerTrip → siempre aprobación
  allowPersonalUse: boolean;
  allowInternational: boolean;
}

const DEFAULT_POLICY: TravelPolicy = {
  enabled: true,
  maxFarePerTrip: 50,
  maxFarePerDay: 150,
  maxFarePerMonth: 800,
  requireJustificationAbove: 30,
  allowedServices: ['transport','tours','experiences','accommodation'],
  allowedDays: [1,2,3,4,5],
  allowedHoursFrom: '06:00',
  allowedHoursTo: '22:00',
  autoApproveBelow: 20,
  requireApprovalAbove: 40,
  allowPersonalUse: false,
  allowInternational: false,
};

const SERVICES = [
  { key:'transport',     label:'Transporte',    icon:'🚗' },
  { key:'tours',         label:'Tours',         icon:'🗺️' },
  { key:'experiences',   label:'Experiencias',  icon:'🎭' },
  { key:'accommodation', label:'Alojamiento',   icon:'🏨' },
  { key:'parcels',       label:'Encomiendas',   icon:'📦' },
];

const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// ─── Página ───────────────────────────────────────────────────────────────────

export default function PoliticaPage() {
  const { session } = useAuthRedirect();
  const [policy,   setPolicy]   = useState<TravelPolicy>(DEFAULT_POLICY);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [tab,      setTab]      = useState<'gasto' | 'horarios' | 'aprobaciones' | 'servicios'>('gasto');

  const fetchPolicy = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const data = await corpFetch<TravelPolicy>('/corporate/policy', session.accessToken);
      if (data) setPolicy({ ...DEFAULT_POLICY, ...data });
    } catch {}
    setLoading(false);
  }, [session?.accessToken]);

  useEffect(() => { fetchPolicy(); }, [fetchPolicy]);

  if (!session) return null;

  async function savePolicy() {
    setSaving(true);
    try {
      await corpFetch('/corporate/policy', session!.accessToken, {
        method: 'PUT', body: JSON.stringify(policy),
      });
    } catch {}
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function toggleDay(d: number) {
    setPolicy(prev => ({
      ...prev,
      allowedDays: prev.allowedDays.includes(d)
        ? prev.allowedDays.filter(x => x !== d)
        : [...prev.allowedDays, d],
    }));
  }

  function toggleService(s: string) {
    setPolicy(prev => ({
      ...prev,
      allowedServices: prev.allowedServices.includes(s)
        ? prev.allowedServices.filter(x => x !== s)
        : [...prev.allowedServices, s],
    }));
  }

  const Field = ({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  const MoneyInput = ({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) => (
    <div className="flex items-center gap-1.5">
      <span className="text-sm text-slate-500">$</span>
      <input type="number" min={0} max={max} value={value} onChange={e => onChange(+e.target.value)}
        className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button type="button" onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  );

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Política de Viajes</h1>
          <p className="text-slate-500 text-sm mt-1">Define las reglas que aplican a todos los empleados al solicitar servicios Going</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {saved && <span className="text-sm text-green-600 font-medium">✅ Guardado</span>}
          <button onClick={savePolicy} disabled={saving}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-opacity bg-blue-600 hover:bg-blue-700">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Master toggle */}
      <div className={`rounded-2xl border p-5 mb-5 flex items-center justify-between ${policy.enabled ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
        <div>
          <p className="font-bold text-slate-900">Política de viajes {policy.enabled ? 'activa' : 'desactivada'}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            {policy.enabled
              ? 'Se aplican restricciones y límites a todos los empleados.'
              : 'Empleados pueden reservar sin restricciones de política.'}
          </p>
        </div>
        <Toggle checked={policy.enabled} onChange={() => setPolicy(p => ({...p, enabled:!p.enabled}))} />
      </div>

      {/* Policy preview pill */}
      {policy.enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">Vista previa del empleado al reservar:</p>
          <p className="text-xs">
            Límite por viaje: <strong>${policy.maxFarePerTrip}</strong> ·
            Justificación requerida desde <strong>${policy.requireJustificationAbove}</strong> ·
            Aprobación automática hasta <strong>${policy.autoApproveBelow}</strong> ·
            Horario: <strong>{policy.allowedHoursFrom}–{policy.allowedHoursTo}</strong>
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5 overflow-x-auto">
        {([['gasto','💰 Límites de gasto'],['horarios','🕐 Horarios'],['aprobaciones','✅ Aprobaciones'],['servicios','🚗 Servicios']] as const).map(([t,lbl]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-1 ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {lbl}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6">

        {/* Gasto */}
        {tab === 'gasto' && (
          <>
            <Field label="Tarifa máxima por viaje" sub="El empleado no puede solicitar servicios por encima de este valor">
              <MoneyInput value={policy.maxFarePerTrip} onChange={v => setPolicy(p => ({...p, maxFarePerTrip:v}))} />
            </Field>
            <Field label="Gasto máximo por día" sub="Suma de todos los servicios en un mismo día">
              <MoneyInput value={policy.maxFarePerDay} onChange={v => setPolicy(p => ({...p, maxFarePerDay:v}))} />
            </Field>
            <Field label="Gasto máximo por mes" sub="Por empleado — al superarlo requiere autorización especial">
              <MoneyInput value={policy.maxFarePerMonth} onChange={v => setPolicy(p => ({...p, maxFarePerMonth:v}))} />
            </Field>
            <Field label="Justificación requerida desde" sub="El empleado debe escribir el motivo del viaje al superar este monto">
              <MoneyInput value={policy.requireJustificationAbove} onChange={v => setPolicy(p => ({...p, requireJustificationAbove:v}))} />
            </Field>
            <Field label="Uso personal permitido" sub="Empleados pueden usar Going para viajes personales fuera de horario laboral">
              <Toggle checked={policy.allowPersonalUse} onChange={() => setPolicy(p => ({...p, allowPersonalUse:!p.allowPersonalUse}))} />
            </Field>
            <Field label="Servicios internacionales" sub="Permite reservar tours y alojamiento fuera del país">
              <Toggle checked={policy.allowInternational} onChange={() => setPolicy(p => ({...p, allowInternational:!p.allowInternational}))} />
            </Field>
          </>
        )}

        {/* Horarios */}
        {tab === 'horarios' && (
          <>
            <Field label="Días laborables permitidos" sub="Fuera de estos días, las reservas requieren aprobación especial">
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => (
                  <button key={i} type="button" onClick={() => toggleDay(i)}
                    className={`w-9 h-9 rounded-lg text-xs font-bold border transition-all ${policy.allowedDays.includes(i) ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-400'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Hora de inicio permitida" sub="Antes de esta hora se requiere aprobación">
              <input type="time" value={policy.allowedHoursFrom}
                onChange={e => setPolicy(p => ({...p, allowedHoursFrom:e.target.value}))}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </Field>
            <Field label="Hora de cierre permitida" sub="Después de esta hora se requiere aprobación">
              <input type="time" value={policy.allowedHoursTo}
                onChange={e => setPolicy(p => ({...p, allowedHoursTo:e.target.value}))}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </Field>
            <div className="py-4">
              <p className="text-xs text-slate-400">
                Horario actual: <strong className="text-slate-600">{DAYS.filter((_,i) => policy.allowedDays.includes(i)).join(', ')}</strong> de <strong className="text-slate-600">{policy.allowedHoursFrom}</strong> a <strong className="text-slate-600">{policy.allowedHoursTo}</strong>
              </p>
            </div>
          </>
        )}

        {/* Aprobaciones */}
        {tab === 'aprobaciones' && (
          <>
            <Field label="Aprobación automática hasta" sub="Reservas por debajo de este monto se aprueban sin intervención del manager">
              <MoneyInput value={policy.autoApproveBelow} onChange={v => setPolicy(p => ({...p, autoApproveBelow:v}))} />
            </Field>
            <Field label="Requiere aprobación del manager desde" sub="Entre este monto y el máximo por viaje, el manager debe aprobar">
              <MoneyInput value={policy.requireApprovalAbove} onChange={v => setPolicy(p => ({...p, requireApprovalAbove:v}))} />
            </Field>
            <div className="py-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Flujo de aprobación actual</p>
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-medium">$0 – ${policy.autoApproveBelow}: Auto ✓</span>
                <span className="text-slate-300">→</span>
                <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full font-medium">${policy.autoApproveBelow} – ${policy.requireApprovalAbove}: Manager</span>
                <span className="text-slate-300">→</span>
                <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-medium">${policy.requireApprovalAbove}+: Admin</span>
                <span className="text-slate-300">→</span>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full font-medium">${policy.maxFarePerTrip}+: Bloqueado</span>
              </div>
            </div>
          </>
        )}

        {/* Servicios */}
        {tab === 'servicios' && (
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">Selecciona los tipos de servicio que los empleados pueden solicitar</p>
            <div className="space-y-3">
              {SERVICES.map(s => (
                <label key={s.key} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{s.label}</p>
                      <p className="text-xs text-slate-400">
                        {policy.allowedServices.includes(s.key) ? 'Habilitado para empleados' : 'Deshabilitado'}
                      </p>
                    </div>
                  </div>
                  <Toggle
                    checked={policy.allowedServices.includes(s.key)}
                    onChange={() => toggleService(s.key)}
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
