'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMonorepoApp } from '@going-monorepo-clean/frontend-providers';
import { AdminLayout } from '../components';
import { Loading } from '@going-monorepo-clean/shared-ui';
import { API } from '../../lib/admin-api';

declare const L: any;

/* ─── Types ─────────────────────────────────────────────────────────────── */
type ZoneType = 'cobertura' | 'aeropuerto' | 'precio_especial' | 'restringida' | 'evento';

interface Zone {
  id: string; name: string; type: ZoneType;
  lat: number; lng: number; radiusKm: number;
  active: boolean; multiplier?: number;
  allowedServices?: string[];
  activeFrom?: string; activeTo?: string;
  alertOnEnter?: boolean; alertOnExit?: boolean;
  description?: string;
}

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

async function adminFetch(token: string, path: string, opts?: RequestInit) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const ZONE_CFG: Record<ZoneType, { label: string; color: string; fillColor: string; icon: string; desc: string }> = {
  cobertura:      { label:'Cobertura',       color:'#2563eb', fillColor:'#3b82f6', icon:'🔵', desc:'Área de servicio activo' },
  aeropuerto:     { label:'Aeropuerto',      color:'#7c3aed', fillColor:'#8b5cf6', icon:'✈️', desc:'Tarifa especial aeropuerto' },
  precio_especial:{ label:'Precio especial', color:'#d97706', fillColor:'#f59e0b', icon:'💰', desc:'Multiplicador de precio activo' },
  restringida:    { label:'Restringida',     color:'#dc2626', fillColor:'#ef4444', icon:'🚫', desc:'Sin servicio en esta zona' },
  evento:         { label:'Evento',          color:'#059669', fillColor:'#10b981', icon:'🎉', desc:'Zona de evento temporal' },
};

const SERVICES = ['transport','tours','experiences','accommodation','parcels'];
const SERVICE_LABELS: Record<string,string> = {
  transport:'Transporte', tours:'Tours', experiences:'Experiencias',
  accommodation:'Alojamiento', parcels:'Encomiendas',
};


const EMPTY_ZONE: Omit<Zone,'id'> = {
  name:'', type:'cobertura', lat:-0.2299, lng:-78.5249, radiusKm:3,
  active:true, multiplier:1.0, allowedServices:[...SERVICES],
  alertOnEnter:false, alertOnExit:false, description:'',
};

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function ZonasPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<any>(null);
  const circles   = useRef<Record<string, any>>({});

  const [zones,        setZones]        = useState<Zone[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);
  const [modal,        setModal]        = useState<'new' | 'edit' | null>(null);
  const [editZone,     setEditZone]     = useState<Zone | null>(null);
  const [form,         setForm]         = useState<Omit<Zone,'id'>>(EMPTY_ZONE);
  const [saving,       setSaving]       = useState(false);
  const [toastMsg,     setToastMsg]     = useState('');
  const [selectedId,   setSelectedId]   = useState<string | null>(null);

  const toast = (m: string) => { setToastMsg(m); setTimeout(() => setToastMsg(''), 3000); };

  /* Load Leaflet */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) { setLeafletReady(true); return; }
    const css = document.createElement('link'); css.rel='stylesheet';
    css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
    const js = document.createElement('script');
    js.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => setLeafletReady(true); document.head.appendChild(js);
  }, []);

  /* Init map */
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInst.current) return;
    mapInst.current = L.map(mapRef.current).setView([-0.2299, -78.5249], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'© OpenStreetMap', maxZoom:18,
    }).addTo(mapInst.current);
    mapInst.current.on('click', (e: any) => {
      setForm(prev => ({ ...prev, lat: +e.latlng.lat.toFixed(5), lng: +e.latlng.lng.toFixed(5) }));
    });
  }, [leafletReady]);

  /* Fetch zones */
  const fetchZones = useCallback(async () => {
    const data = await safeGet<any>(token, '/zones?limit=100');
    const raw: any[] = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
    setZones(raw);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  /* Draw zones on map */
  useEffect(() => {
    if (!mapInst.current || !leafletReady || loading) return;
    // Clear old circles
    Object.values(circles.current).forEach(c => c.remove());
    circles.current = {};
    zones.forEach(z => {
      const cfg = ZONE_CFG[z.type];
      const c = L.circle([z.lat, z.lng], {
        radius: z.radiusKm * 1000,
        color: cfg.color, fillColor: cfg.fillColor,
        fillOpacity: z.active ? 0.15 : 0.05,
        weight: z.active ? 2 : 1,
        dashArray: z.active ? undefined : '6,4',
      }).addTo(mapInst.current);
      c.bindPopup(`<div style="min-width:160px">
        <b>${z.name}</b><br/>
        <span style="font-size:11px;color:#666">${cfg.label} · ${z.radiusKm} km radio</span><br/>
        ${z.multiplier && z.multiplier !== 1 ? `<span style="font-weight:600;color:${cfg.color}">×${z.multiplier} precio</span><br/>` : ''}
        <span style="font-size:11px;color:${z.active ? '#16a34a' : '#9ca3af'}">${z.active ? '● Activa' : '○ Inactiva'}</span>
      </div>`);
      c.on('click', () => setSelectedId(z.id));
      circles.current[z.id] = c;
    });
  }, [zones, leafletReady, loading]);

  /* Focus on zone */
  function focusZone(z: Zone) {
    setSelectedId(z.id);
    if (mapInst.current) {
      mapInst.current.flyTo([z.lat, z.lng], 13, { duration: 0.8 });
      circles.current[z.id]?.openPopup();
    }
  }

  /* Save zone */
  async function saveZone() {
    if (!form.name.trim()) { toast('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      if (modal === 'edit' && editZone) {
        await adminFetch(token, `/zones/${editZone.id}`, { method:'PATCH', body: JSON.stringify(form) });
        setZones(prev => prev.map(z => z.id === editZone.id ? { ...z, ...form } : z));
        toast('Zona actualizada');
      } else {
        const created = await adminFetch(token, '/zones', { method:'POST', body: JSON.stringify(form) })
          .catch(() => ({ ...form, id: `z${Date.now()}` }));
        setZones(prev => [...prev, created]);
        toast('Zona creada');
      }
      setModal(null);
    } catch { toast('Error al guardar'); }
    setSaving(false);
  }

  async function toggleZone(z: Zone) {
    try { await adminFetch(token, `/zones/${z.id}`, { method:'PATCH', body: JSON.stringify({ active: !z.active }) }); } catch {}
    setZones(prev => prev.map(x => x.id === z.id ? { ...x, active: !x.active } : x));
  }

  async function deleteZone(z: Zone) {
    if (!confirm(`¿Eliminar la zona "${z.name}"?`)) return;
    try { await adminFetch(token, `/zones/${z.id}`, { method:'DELETE' }); } catch {}
    setZones(prev => prev.filter(x => x.id !== z.id));
    toast('Zona eliminada');
  }

  function openEdit(z: Zone) {
    setEditZone(z);
    setForm({ name:z.name, type:z.type, lat:z.lat, lng:z.lng, radiusKm:z.radiusKm,
      active:z.active, multiplier:z.multiplier??1, allowedServices:z.allowedServices??[...SERVICES],
      alertOnEnter:z.alertOnEnter??false, alertOnExit:z.alertOnExit??false, description:z.description??'' });
    setModal('edit');
  }

  function openNew() {
    setEditZone(null);
    setForm(EMPTY_ZONE);
    setModal('new');
  }

  if (auth.isLoading || loading) return <Loading fullHeight size="lg" message="Cargando zonas…" />;

  const activeZones = zones.filter(z => z.active).length;

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{toastMsg}</div>
      )}

      {/* Zone modal */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-bold text-lg text-gray-900">{modal === 'new' ? 'Nueva zona' : `Editar: ${editZone?.name}`}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Nombre</label>
                  <input value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Ej: Aeropuerto El Dorado" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Tipo</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type:e.target.value as ZoneType}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                    {(Object.entries(ZONE_CFG) as [ZoneType, any][]).map(([k,v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Radio (km)</label>
                  <input type="number" min={0.5} max={50} step={0.5} value={form.radiusKm}
                    onChange={e => setForm(p => ({...p, radiusKm:+e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Latitud</label>
                  <input type="number" step="0.00001" value={form.lat}
                    onChange={e => setForm(p => ({...p, lat:+e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Longitud</label>
                  <input type="number" step="0.00001" value={form.lng}
                    onChange={e => setForm(p => ({...p, lng:+e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none font-mono" />
                </div>
              </div>

              <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                💡 Haz clic en el mapa para seleccionar coordenadas automáticamente
              </p>

              {(form.type === 'precio_especial' || form.type === 'aeropuerto' || form.type === 'evento') && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
                    Multiplicador de precio (×{form.multiplier?.toFixed(1)})
                  </label>
                  <input type="range" min={1} max={3} step={0.1} value={form.multiplier ?? 1}
                    onChange={e => setForm(p => ({...p, multiplier:+e.target.value}))}
                    className="w-full" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>×1.0 (sin cambio)</span><span>×3.0 (triple)</span></div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Servicios permitidos</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map(s => {
                    const checked = (form.allowedServices ?? SERVICES).includes(s);
                    return (
                      <button key={s} type="button"
                        onClick={() => setForm(p => ({...p, allowedServices: checked
                          ? (p.allowedServices??SERVICES).filter(x => x !== s)
                          : [...(p.allowedServices??SERVICES), s]
                        }))}
                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${checked ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500'}`}>
                        {SERVICE_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.type === 'restringida' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Alertas</label>
                  {[['alertOnEnter','Alerta al entrar a la zona'],['alertOnExit','Alerta al salir de la zona']].map(([key,lbl]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={(form as any)[key]}
                        onChange={e => setForm(p => ({...p, [key]:e.target.checked}))}
                        className="rounded" />
                      <span className="text-sm text-gray-700">{lbl}</span>
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Descripción (opcional)</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))}
                  rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none"
                  placeholder="Notas internas sobre esta zona…" />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({...p, active:e.target.checked}))} className="rounded" />
                <span className="text-sm font-medium text-gray-700">Zona activa</span>
              </label>
            </div>

            <div className="p-6 border-t flex gap-3">
              <button onClick={saveZone} disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#011627' }}>
                {saving ? 'Guardando…' : modal === 'new' ? 'Crear zona' : 'Guardar cambios'}
              </button>
              <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zonas & Geofencing</h1>
          <p className="text-sm text-gray-500 mt-1">{activeZones} de {zones.length} zonas activas · haz clic en el mapa para colocar una nueva zona</p>
        </div>
        <button onClick={openNew}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#ff4c41' }}>
          + Nueva Zona
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap mb-4">
        {(Object.entries(ZONE_CFG) as [ZoneType, any][]).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: v.fillColor }} />
            {v.icon} {v.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height:'520px' }}>
            {!leafletReady && (
              <div className="h-full flex items-center justify-center text-gray-400 animate-pulse">
                <div className="text-center"><div className="text-5xl mb-3">🗺️</div><p>Cargando mapa…</p></div>
              </div>
            )}
            <div ref={mapRef} style={{ height:'100%', width:'100%' }} />
          </div>
        </div>

        {/* Zone list */}
        <div className="space-y-3 overflow-y-auto" style={{ maxHeight:'520px' }}>
          {zones.map(z => {
            const cfg = ZONE_CFG[z.type];
            const isSelected = selectedId === z.id;
            return (
              <div key={z.id}
                className={`bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2' : ''}`}
                style={{ borderColor: isSelected ? cfg.color : '#f3f4f6', '--tw-ring-color': cfg.color } as any}
                onClick={() => focusZone(z)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{cfg.icon}</span>
                      <p className="font-semibold text-gray-900 text-sm truncate">{z.name}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{cfg.label} · {z.radiusKm} km radio</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleZone(z); }}
                    className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors relative ${z.active ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${z.active ? 'left-4' : 'left-0.5'}`} />
                  </button>
                </div>
                {z.multiplier && z.multiplier !== 1 && (
                  <p className="text-xs font-semibold mb-1" style={{ color: cfg.color }}>×{z.multiplier.toFixed(1)} multiplicador</p>
                )}
                {z.description && <p className="text-xs text-gray-400 truncate mb-2">{z.description}</p>}
                <div className="flex gap-2 mt-2">
                  <button onClick={e => { e.stopPropagation(); openEdit(z); }}
                    className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    ✏ Editar
                  </button>
                  <button onClick={e => { e.stopPropagation(); deleteZone(z); }}
                    className="text-xs py-1.5 px-3 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </AdminLayout>
  );
}
