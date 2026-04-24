/**
 * Sostenibilidad / Carbon Footprint
 * Ruta: /empresas/sostenibilidad
 *
 * Reporte de huella de carbono de los viajes corporativos.
 * CO₂ por tipo de vehículo, tendencia mensual, desglose por departamento.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import { corpFetch } from "@/lib/empresas/api";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface MonthData {
  month: string;    // "Ene", "Feb", etc.
  co2kg: number;
  trips: number;
  distanceKm: number;
}

interface DeptData {
  department: string;
  co2kg: number;
  trips: number;
}

interface ServiceData {
  service: string;
  co2kg: number;
  trips: number;
  emissionFactor: number; // kg CO₂ / km
}

interface ESGSummary {
  totalCo2Kg: number;
  totalTrips: number;
  totalDistanceKm: number;
  avgCo2PerTrip: number;
  vsLastMonth: number;        // % change
  vsIndustryAvg: number;      // % mejor/peor que industria
  byMonth: MonthData[];
  byDepartment: DeptData[];
  byService: ServiceData[];
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO: ESGSummary = {
  totalCo2Kg: 847.4,
  totalTrips: 234,
  totalDistanceKm: 4186,
  avgCo2PerTrip: 3.62,
  vsLastMonth: -8.3,
  vsIndustryAvg: -22,
  byMonth: [
    { month:'Nov', co2kg:980, trips:260, distanceKm:4800 },
    { month:'Dic', co2kg:720, trips:190, distanceKm:3500 },
    { month:'Ene', co2kg:1050, trips:280, distanceKm:5100 },
    { month:'Feb', co2kg:890, trips:240, distanceKm:4300 },
    { month:'Mar', co2kg:923, trips:255, distanceKm:4500 },
    { month:'Abr', co2kg:847, trips:234, distanceKm:4186 },
  ],
  byDepartment: [
    { department:'Comercial',   co2kg:312, trips:86 },
    { department:'Logística',   co2kg:198, trips:55 },
    { department:'TI',          co2kg:145, trips:40 },
    { department:'Finanzas',    co2kg:112, trips:31 },
    { department:'RRHH',        co2kg:80,  trips:22 },
  ],
  byService: [
    { service:'Transporte',    co2kg:623, trips:185, emissionFactor:0.21 },
    { service:'Tours',         co2kg:142, trips:31,  emissionFactor:0.15 },
    { service:'Experiencias',  co2kg:52,  trips:14,  emissionFactor:0.10 },
    { service:'Alojamiento',   co2kg:30,  trips:4,   emissionFactor:0.05 },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function co2ToEquivalents(kg: number) {
  return {
    trees:   +(kg / 21.77).toFixed(1),      // 1 árbol absorbe ~21.77 kg CO₂/año
    flights: +(kg / 90).toFixed(1),         // vuelo corto ~90 kg CO₂
    carKm:   Math.round(kg / 0.21),         // 0.21 kg/km coche gasolina
  };
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function SostenibilidadPage() {
  const { session } = useAuthRedirect();
  const [data,    setData]    = useState<ESGSummary>(DEMO);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState<'month' | 'quarter' | 'year'>('month');

  if (!session) return null;

  const fetchData = useCallback(async () => {
    try {
      const res = await corpFetch<ESGSummary>(`/corporate/sustainability?period=${period}`, session!.accessToken);
      if (res?.totalTrips) setData(res);
    } catch {}
    setLoading(false);
  }, [session!.accessToken, period]);

  useEffect(() => { setLoading(true); fetchData(); }, [fetchData]);

  const eq = co2ToEquivalents(data.totalCo2Kg);
  const maxMonth = Math.max(...data.byMonth.map(m => m.co2kg));
  const maxDept  = Math.max(...data.byDepartment.map(d => d.co2kg));

  const isImproving = data.vsLastMonth < 0;

  return (
    <div className="max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-slate-900">Sostenibilidad</h1>
            <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-semibold">ODS 13</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">Huella de carbono de los viajes corporativos · estimación basada en distancia y tipo de servicio</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {([['month','Este mes'],['quarter','Trimestre'],['year','Año']] as const).map(([v,l]) => (
              <button key={v} onClick={() => setPeriod(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period===v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                {l}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium">
            📄 Reporte ESG
          </button>
        </div>
      </div>

      {/* Hero CO₂ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-1 bg-gradient-to-br from-green-700 to-green-500 rounded-2xl p-6 text-white">
          <p className="text-green-200 text-sm font-medium mb-1">CO₂ total estimado</p>
          <p className="text-5xl font-black">{data.totalCo2Kg.toFixed(0)}</p>
          <p className="text-green-200 text-sm mt-1">kg CO₂ equivalente</p>
          <div className="mt-4 flex items-center gap-2">
            <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${isImproving ? 'bg-green-400/30 text-green-100' : 'bg-red-400/30 text-red-100'}`}>
              {isImproving ? '↓' : '↑'} {Math.abs(data.vsLastMonth)}% vs mes anterior
            </span>
          </div>
          {data.vsIndustryAvg < 0 && (
            <p className="text-xs text-green-200 mt-3">
              ✅ {Math.abs(data.vsIndustryAvg)}% mejor que la media del sector
            </p>
          )}
        </div>

        <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label:'Viajes totales',    value: data.totalTrips,                          unit:'viajes',    icon:'🚗', color:'#2563eb' },
            { label:'Distancia total',   value: data.totalDistanceKm.toLocaleString(),    unit:'km',        icon:'📍', color:'#7c3aed' },
            { label:'CO₂ por viaje',     value: data.avgCo2PerTrip.toFixed(2),           unit:'kg / viaje', icon:'💨', color:'#d97706' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <span className="text-2xl">{k.icon}</span>
              <p className="text-xl font-black mt-2" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{k.unit}</p>
              <p className="text-xs font-medium text-slate-700 mt-1">{k.label}</p>
            </div>
          ))}

          {/* Equivalencias */}
          <div className="col-span-2 sm:col-span-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Equivalencias de huella</p>
            <div className="flex gap-5 flex-wrap text-sm">
              <span className="text-emerald-800"><strong>🌳 {eq.trees}</strong> árboles/año para compensar</span>
              <span className="text-emerald-800"><strong>✈️ {eq.flights}</strong> vuelos cortos equivalentes</span>
              <span className="text-emerald-800"><strong>🚗 {eq.carKm.toLocaleString()}</strong> km en auto a gasolina</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Tendencia mensual de CO₂</h2>
          <div className="space-y-2">
            {data.byMonth.map((m, i) => {
              const isLast = i === data.byMonth.length - 1;
              const pct = (m.co2kg / maxMonth) * 100;
              return (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-7 flex-shrink-0">{m.month}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div className="h-full rounded-lg transition-all flex items-center pl-2"
                      style={{ width:`${pct}%`, backgroundColor: isLast ? '#16a34a' : '#94a3b8' }}>
                      <span className="text-xs font-bold text-white whitespace-nowrap">
                        {m.co2kg >= 80 ? `${m.co2kg} kg` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 w-14 text-right flex-shrink-0">{m.co2kg} kg</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* By department */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Por departamento</h2>
          <div className="space-y-3">
            {data.byDepartment.map(d => {
              const pct = (d.co2kg / maxDept) * 100;
              return (
                <div key={d.department}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{d.department}</span>
                    <span className="text-slate-500">{d.co2kg} kg · {d.trips} viajes</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width:`${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By service */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Por tipo de servicio</h2>
          <div className="space-y-3">
            {data.byService.map(s => (
              <div key={s.service} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{s.service}</span>
                    <span className="text-slate-500">{s.co2kg} kg</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${(s.co2kg/data.totalCo2Kg)*100}%`, backgroundColor:'#2563eb' }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{((s.co2kg/data.totalCo2Kg)*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400">Factores de emisión: transporte 0.21 kg/km · tours 0.15 kg/km · experiencias 0.10 kg/km</p>
          </div>
        </div>

        {/* Offset + tips */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 mb-4">Reducción & compensación</h2>
          <div className="space-y-3">
            {[
              { icon:'🌱', title:'Programa de compensación', desc:'Going planta 1 árbol por cada $50 en servicios Going Eco. Actívalo en Configuración.', action:'Activar Going Eco →', color:'#16a34a' },
              { icon:'🚌', title:'Fomentar viajes compartidos', desc:'Los traslados al aeropuerto en grupo reducen hasta un 60% las emisiones por persona.', action:'Ver opciones →', color:'#2563eb' },
              { icon:'⚡', title:'Vehículos eléctricos',        desc:'Going tiene flota EV disponible en Quito. Emiten 75% menos CO₂ que gasolina.', action:'Filtrar solo EV →', color:'#7c3aed' },
            ].map(t => (
              <div key={t.title} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="text-2xl flex-shrink-0">{t.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                  <button className="text-xs font-semibold mt-1.5" style={{ color: t.color }}>{t.action}</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ODS badge */}
      <div className="mt-5 bg-gradient-to-r from-green-700 to-teal-600 rounded-2xl p-5 text-white flex items-center gap-5 flex-wrap">
        <div className="text-4xl">🌍</div>
        <div className="flex-1">
          <p className="font-bold text-lg">Comprometidos con los ODS de la ONU</p>
          <p className="text-green-200 text-sm mt-0.5">
            Going contribuye al <strong>ODS 13 (Acción por el Clima)</strong> y al <strong>ODS 11 (Ciudades sostenibles)</strong>.
            Este reporte es válido para incluir en memorias de sostenibilidad corporativa.
          </p>
        </div>
        <button onClick={() => window.print()}
          className="px-5 py-2.5 bg-white text-green-800 rounded-xl text-sm font-bold hover:bg-green-50 transition-colors flex-shrink-0">
          📄 Descargar PDF
        </button>
      </div>

    </div>
  );
}
