'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMonorepoApp } from '@/lib/providers';
import { AdminLayout } from '../components';
import { Loading } from '@/lib/shared-ui';
import { API } from '../../lib/admin-api';

declare const L: any;

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface ActiveDriver {
  id: string; name?: string; plate?: string;
  lat: number; lng: number; status?: string;
}
interface TourLocation {
  id: string; name: string; lat: number; lng: number;
  activeBookings?: number; guideName?: string;
  duration?: string; price?: number; city?: string;
}
interface ExperienceLocation {
  id: string; name: string; lat: number; lng: number;
  activeBookings?: number; hostName?: string;
  category?: string; price?: number; city?: string;
}
interface CorporateTrip {
  id: string; employeeName: string; companyName: string; companyId: string;
  lat: number; lng: number; status: string;
  destination?: string; consentGiven: boolean;
  vehiclePlate?: string; driverName?: string;
}
interface ActiveRoute {
  id: string; originLat: number; originLng: number;
  destLat: number; destLng: number;
}

type Layer = 'transporte' | 'tours' | 'experiencias' | 'corporativo';

async function safeGet<T>(token: string, path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    return r.ok ? r.json() : null;
  } catch { return null; }
}

/* ─── Demo data ─────────────────────────────────────────────────────────── */
/* Solo empleados con consentGiven:true llegan a este array */

/* ─── Icon builders ──────────────────────────────────────────────────────── */
function driverIcon(busy: boolean) {
  const bg = busy ? '#ff4c41' : '#22c55e';
  return { html:`<div style="width:34px;height:34px;border-radius:50%;background:${bg};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:15px">🚗</div>`, size:[34,34] };
}
function tourIcon(active: boolean) {
  const ring = active ? '0 0 0 4px rgba(22,163,74,.35)' : 'none';
  return { html:`<div style="width:36px;height:36px;border-radius:10px;background:#16a34a;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25),${ring};display:flex;align-items:center;justify-content:center;font-size:16px">🗺️</div>`, size:[36,36] };
}
function expIcon(active: boolean) {
  const ring = active ? '0 0 0 4px rgba(139,92,246,.35)' : 'none';
  return { html:`<div style="width:36px;height:36px;border-radius:10px;background:#8b5cf6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25),${ring};display:flex;align-items:center;justify-content:center;font-size:16px">🎭</div>`, size:[36,36] };
}
function corpIcon(active: boolean) {
  const ring = active ? '0 0 0 4px rgba(234,88,12,.30)' : 'none';
  return { html:`<div style="width:36px;height:36px;border-radius:10px;background:#ea580c;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25),${ring};display:flex;align-items:center;justify-content:center;font-size:16px">🏢</div>`, size:[36,36] };
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function MapPage() {
  const { auth } = useMonorepoApp();
  const token: string = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? '' : '';

  const mapRef   = useRef<HTMLDivElement>(null);
  const mapInst  = useRef<any>(null);
  const mapItems = useRef<any[]>([]);

  const [drivers,      setDrivers]      = useState<ActiveDriver[]>([]);
  const [tours,        setTours]        = useState<TourLocation[]>([]);
  const [experiences,  setExperiences]  = useState<ExperienceLocation[]>([]);
  const [corporate,    setCorporate]    = useState<CorporateTrip[]>([]);
  const [routes,       setRoutes]       = useState<ActiveRoute[]>([]);
  const [layers,       setLayers]       = useState<Set<Layer>>(new Set(['transporte','tours','experiencias','corporativo']));
  const [corpFilter,   setCorpFilter]   = useState<string>('all');
  const [leafletReady, setLeafletReady] = useState(false);
  const [lastUpd,      setLastUpd]      = useState<Date|null>(null);
  const [loading,      setLoading]      = useState(true);

  /* Load Leaflet */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).L) { setLeafletReady(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onload = () => setLeafletReady(true);
    document.head.appendChild(js);
  }, []);

  /* Init map */
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { zoomControl: true }).setView([-0.2299, -78.5249], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 18,
    }).addTo(mapInst.current);
  }, [leafletReady]);

  /* Fetch all data */
  const fetchData = useCallback(async () => {
    const [driverData, tourData, expData, routeData, corpData] = await Promise.all([
      safeGet<any>(token, '/admin/stats/transport/active-drivers'),
      safeGet<any>(token, '/tours/search?limit=100'),
      safeGet<any>(token, '/experiences/search?limit=100'),
      safeGet<any>(token, '/bookings?status=in_progress&limit=50'),
      safeGet<any>(token, '/corporate/bookings/active?limit=100'),
    ]);

    const dRaw: any[] = Array.isArray(driverData) ? driverData : driverData?.drivers ?? driverData?.data ?? [];
    setDrivers(dRaw);

    const tRaw: any[] = Array.isArray(tourData) ? tourData : tourData?.data ?? tourData?.items ?? [];
    setTours(tRaw.filter((t: any) => t.latitude ?? t.lat).map((t: any) => ({
      id: t.id, name: t.name ?? t.title ?? 'Tour',
      lat: t.latitude ?? t.lat, lng: t.longitude ?? t.lng,
      guideName: t.guideName ?? t.guide?.name,
      duration: t.duration, price: t.price ?? t.basePrice,
      city: t.city ?? t.location, activeBookings: t.activeBookings ?? 0,
    })));

    const eRaw: any[] = Array.isArray(expData) ? expData : expData?.data ?? expData?.items ?? [];
    setExperiences(eRaw.filter((e: any) => e.latitude ?? e.lat).map((e: any) => ({
      id: e.id, name: e.name ?? e.title ?? 'Experiencia',
      lat: e.latitude ?? e.lat, lng: e.longitude ?? e.lng,
      hostName: e.hostName ?? e.host?.name,
      category: e.category ?? e.type, price: e.price ?? e.basePrice,
      city: e.city ?? e.location, activeBookings: e.activeBookings ?? 0,
    })));

    const rRaw: any[] = Array.isArray(routeData) ? routeData : routeData?.data ?? routeData?.items ?? [];
    setRoutes(rRaw.filter((b: any) => b.originLat && b.destLat)
      .map((b: any) => ({ id: b.id, originLat: b.originLat, originLng: b.originLng, destLat: b.destLat, destLng: b.destLng })));

    /* Corporate — only trips with explicit consent */
    const cRaw: any[] = Array.isArray(corpData) ? corpData : corpData?.data ?? corpData?.items ?? [];
    setCorporate(cRaw.filter((c: any) => c.consentGiven === true).map((c: any) => ({
      id: c.id, employeeName: c.employeeName ?? c.employee?.name ?? 'Empleado',
      companyName: c.companyName ?? c.company?.name ?? 'Empresa',
      companyId: c.companyId ?? c.company?.id ?? '',
      lat: c.lat ?? c.latitude, lng: c.lng ?? c.longitude,
      status: c.status, destination: c.destination,
      consentGiven: true,
      vehiclePlate: c.vehiclePlate ?? c.vehicle?.plate,
      driverName: c.driverName ?? c.driver?.name,
    })));

    setLoading(false); setLastUpd(new Date());
  }, [token]);

  /* Redraw markers */
  useEffect(() => {
    if (!mapInst.current || !leafletReady || loading) return;
    mapItems.current.forEach(item => item.remove());
    mapItems.current = [];

    function addMarker(lat: number, lng: number, iconCfg: {html:string;size:number[]}, popup: string) {
      const icon = L.divIcon({ className:'', html: iconCfg.html, iconSize: iconCfg.size, iconAnchor: [iconCfg.size[0]/2, iconCfg.size[1]/2] });
      const m = L.marker([lat, lng], { icon }).bindPopup(popup).addTo(mapInst.current);
      mapItems.current.push(m);
    }

    if (layers.has('transporte')) {
      drivers.forEach(d => {
        const busy = d.status === 'busy';
        addMarker(d.lat, d.lng, driverIcon(busy),
          `<div style="min-width:140px"><b>${d.name ?? 'Conductor'}</b><br/><span style="font-size:11px;color:#666">${d.plate ?? ''}</span><br/><span style="color:${busy?'#ff4c41':'#22c55e'};font-weight:600">${busy?'En viaje':'Disponible'}</span></div>`);
      });
      routes.forEach(r => {
        const line = L.polyline([[r.originLat, r.originLng],[r.destLat, r.destLng]],
          { color:'#0033A0', weight:3, opacity:0.6, dashArray:'6,4' }).addTo(mapInst.current);
        mapItems.current.push(line);
      });
    }

    if (layers.has('tours')) {
      tours.forEach(t => {
        const active = (t.activeBookings ?? 0) > 0;
        addMarker(t.lat, t.lng, tourIcon(active),
          `<div style="min-width:160px">
            <b>${t.name}</b><br/>
            <span style="font-size:11px;color:#666">${t.city ?? ''} · ${t.duration ?? ''}</span><br/>
            ${t.guideName ? `<span style="font-size:11px">Guía: ${t.guideName}</span><br/>` : ''}
            ${t.price ? `<span style="font-weight:600;color:#16a34a">$${t.price}</span>` : ''}
            ${active ? `<br/><span style="font-size:11px;font-weight:600;color:#16a34a">● ${t.activeBookings} reserva(s) activa(s)</span>` : ''}
          </div>`);
      });
    }

    if (layers.has('experiencias')) {
      experiences.forEach(e => {
        const active = (e.activeBookings ?? 0) > 0;
        addMarker(e.lat, e.lng, expIcon(active),
          `<div style="min-width:160px">
            <b>${e.name}</b><br/>
            <span style="font-size:11px;color:#666">${e.city ?? ''} · ${e.category ?? ''}</span><br/>
            ${e.hostName ? `<span style="font-size:11px">Anfitrión: ${e.hostName}</span><br/>` : ''}
            ${e.price ? `<span style="font-weight:600;color:#8b5cf6">$${e.price}</span>` : ''}
            ${active ? `<br/><span style="font-size:11px;font-weight:600;color:#8b5cf6">● ${e.activeBookings} reserva(s) activa(s)</span>` : ''}
          </div>`);
      });
    }

    if (layers.has('corporativo')) {
      const filtered = corpFilter === 'all' ? corporate : corporate.filter(c => c.companyId === corpFilter);
      filtered.forEach(c => {
        const active = c.status === 'in_progress';
        addMarker(c.lat, c.lng, corpIcon(active),
          `<div style="min-width:170px">
            <div style="font-size:10px;background:#fef3c7;color:#92400e;padding:2px 6px;border-radius:4px;margin-bottom:6px;display:inline-block">✅ Consentimiento activo</div><br/>
            <b>${c.employeeName}</b><br/>
            <span style="font-size:11px;font-weight:600;color:#ea580c">${c.companyName}</span><br/>
            ${c.destination ? `<span style="font-size:11px;color:#666">📍 ${c.destination}</span><br/>` : ''}
            ${c.driverName ? `<span style="font-size:11px;color:#666">🚗 ${c.driverName}${c.vehiclePlate ? ' · ' + c.vehiclePlate : ''}</span><br/>` : ''}
            <span style="font-size:11px;font-weight:600;color:${active?'#ea580c':'#6b7280'}">${active?'● En tránsito':'✓ Completado'}</span>
          </div>`);
      });
    }
  }, [drivers, tours, experiences, corporate, routes, layers, corpFilter, leafletReady, loading]);

  useEffect(() => {
    if (leafletReady) {
      fetchData();
      const id = setInterval(fetchData, 30_000);
      return () => clearInterval(id);
    }
  }, [leafletReady, fetchData]);

  function toggleLayer(l: Layer) {
    setLayers(prev => { const n = new Set(prev); n.has(l) ? n.delete(l) : n.add(l); return n; });
  }

  if (auth.isLoading) return <Loading fullHeight size="lg" message="Cargando mapa…" />;

  const companies = Array.from(new Map(corporate.map(c => [c.companyId, c.companyName])).entries());
  const corpActive = corporate.filter(c => c.status === 'in_progress' && (corpFilter === 'all' || c.companyId === corpFilter)).length;
  const corpTotal  = corporate.filter(c => corpFilter === 'all' || c.companyId === corpFilter).length;

  const LAYER_CFG: { key: Layer; label: string; icon: string; color: string; activeCount: number; totalCount: number }[] = [
    { key:'transporte',   label:'Transporte',   icon:'🚗', color:'#22c55e', activeCount: drivers.filter(d=>d.status==='busy').length,               totalCount: drivers.length      },
    { key:'tours',        label:'Tours',        icon:'🗺️', color:'#16a34a', activeCount: tours.filter(t=>(t.activeBookings??0)>0).length,           totalCount: tours.length        },
    { key:'experiencias', label:'Experiencias', icon:'🎭', color:'#8b5cf6', activeCount: experiences.filter(e=>(e.activeBookings??0)>0).length,     totalCount: experiences.length  },
    { key:'corporativo',  label:'Corporativo',  icon:'🏢', color:'#ea580c', activeCount: corpActive,                                                  totalCount: corpTotal           },
  ];

  return (
    <AdminLayout userName={auth.user?.firstName ?? 'Admin'} onLogout={auth.logout}>

      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mapa en Vivo</h1>
          <p className="text-sm text-gray-500 mt-1">
            {lastUpd ? `${lastUpd.toLocaleTimeString('es-EC')} · ` : ''}Actualización cada 30 s
          </p>
        </div>
        <button onClick={fetchData} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
          ↺ Refrescar
        </button>
      </div>

      {/* Layer toggles */}
      <div className="grid grid-cols-2 gap-3 mb-3 md:grid-cols-4">
        {LAYER_CFG.map(l => (
          <button key={l.key} onClick={() => toggleLayer(l.key)}
            className={`rounded-2xl border p-4 text-left transition-all ${layers.has(l.key) ? 'shadow-sm' : 'opacity-40'}`}
            style={{ borderColor: layers.has(l.key) ? l.color : '#e5e7eb', backgroundColor: layers.has(l.key) ? l.color+'15' : 'white' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{l.icon}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
                style={{ backgroundColor: layers.has(l.key) ? l.color : '#9ca3af' }}>
                {layers.has(l.key) ? 'Visible' : 'Oculto'}
              </span>
            </div>
            <p className="text-sm font-bold text-gray-900">{l.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              <span className="font-semibold" style={{color: l.color}}>{l.activeCount} activo{l.activeCount!==1?'s':''}</span>
              {' '}/ {l.totalCount} total
            </p>
          </button>
        ))}
      </div>

      {/* Corporate consent notice + company filter */}
      {layers.has('corporativo') && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3 flex-wrap">
          <span className="text-amber-700 text-sm flex-1">
            🔒 Solo se muestran empleados con <strong>consentimiento de rastreo activo</strong>. Gestiona permisos en el panel corporativo de cada empresa.
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-600 font-medium">Filtrar empresa:</span>
            <select
              value={corpFilter}
              onChange={e => setCorpFilter(e.target.value)}
              className="text-sm border border-amber-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2"
              style={{'--tw-ring-color': '#ea580c'} as any}
            >
              <option value="all">Todas las empresas</option>
              {companies.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ height:'520px' }}>
        {!leafletReady && (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center animate-pulse">
              <div className="text-5xl mb-3">🗺️</div>
              <p>Cargando mapa…</p>
            </div>
          </div>
        )}
        <div ref={mapRef} style={{ height:'100%', width:'100%' }} />
      </div>

      {/* Legend */}
      <div className="flex gap-5 mt-3 text-xs text-gray-500 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/>Conductor disponible</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>Conductor en viaje</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-lg bg-green-600 inline-block"/>Tour activo</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-lg bg-purple-500 inline-block"/>Experiencia activa</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-lg inline-block" style={{backgroundColor:'#ea580c'}}/>Empleado corporativo</span>
        <span className="flex items-center gap-1.5"><span className="w-6 border-t-2 border-dashed border-blue-600 inline-block"/>Ruta en curso</span>
        <span className="ml-auto text-gray-300">Haz clic en cualquier marcador para más detalle</span>
      </div>

    </AdminLayout>
  );
}
