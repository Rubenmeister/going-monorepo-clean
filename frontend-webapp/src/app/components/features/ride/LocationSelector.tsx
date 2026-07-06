'use client';

import { useState, useEffect, useRef } from 'react';
import type { Location } from '@/types';
import { MapPicker } from './MapPicker';
import {
  loadSavedAddresses,
  upsertSavedAddress,
  iconForType,
  type SavedAddress,
  type SavedAddressType,
} from '@/app/services/savedAddresses';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface LocationSelectorProps {
  type: 'pickup' | 'dropoff';
  value?: Location;
  onChange: (location: Location) => void;
  placeholder?: string;
}

/* Direcciones guardadas / recientes desde localStorage */
interface SavedEntry { label: string; icon: string; address: string; lat: number; lon: number; }

function loadStored(key: string): SavedEntry[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

/* Default Ecuador locations — fallback cuando no hay token o consulta vacía */
const DEFAULT_LOCATIONS: Location[] = [
  // ── Zonas de Quito ─────────────────────────────────────────
  { address: 'Quito Centro Norte',          lat: -0.1807, lon: -78.4678, city: 'Quito' },
  { address: 'Quito Sur',                   lat: -0.3500, lon: -78.5400, city: 'Quito' },
  { address: 'Cumbayá / Tumbaco (Valle)',   lat: -0.2010, lon: -78.4030, city: 'Quito' },
  { address: 'Los Chillos / Sangolquí',     lat: -0.3296, lon: -78.4490, city: 'Quito' },
  { address: 'Aeropuerto de Quito', lat: -0.1292, lon: -78.3575, city: 'Tababela' },

  // ── Ciudades intermedias en rutas hacia Quito ───────────────
  { address: 'Guayllabamba',   lat: -0.0494, lon: -78.3692, city: 'Guayllabamba' },
  { address: 'Cayambe',        lat:  0.0423, lon: -78.1368, city: 'Cayambe' },
  { address: 'Tabacundo',      lat:  0.0454, lon: -78.2025, city: 'Tabacundo' },
  { address: 'El Quinche',     lat: -0.1012, lon: -78.3136, city: 'El Quinche' },
  { address: 'Pifo',           lat: -0.2279, lon: -78.3520, city: 'Pifo' },
  { address: 'Machachi',       lat: -0.5104, lon: -78.5698, city: 'Machachi' },
  { address: 'Tambillo',       lat: -0.4360, lon: -78.5598, city: 'Tambillo' },
  { address: 'Aloasí',         lat: -0.5300, lon: -78.5700, city: 'Aloasí' },
  // ── Ruta Norte: Ibarra / Otavalo y zona (misma tarifa) ────────
  { address: 'Otavalo',        lat:  0.2342, lon: -78.2637, city: 'Otavalo' },
  { address: 'Peguche',        lat:  0.2520, lon: -78.2530, city: 'Otavalo' },
  { address: 'Atuntaqui',      lat:  0.3360, lon: -78.2150, city: 'Atuntaqui' },
  { address: 'Cotacachi',      lat:  0.3049, lon: -78.2656, city: 'Cotacachi' },

  // ── Ruta Santo Domingo / El Carmen ────────────────────────────
  { address: 'La Concordia',   lat: -0.0058, lon: -79.3933, city: 'La Concordia' },

  // ── Ruta Ambato: ciudades intermedias ─────────────────────────
  { address: 'Salcedo',        lat: -1.0578, lon: -78.5922, city: 'Salcedo' },
  { address: 'Píllaro',        lat: -1.1657, lon: -78.5373, city: 'Píllaro' },
  { address: 'Cevallos',       lat: -1.3600, lon: -78.6300, city: 'Cevallos' },
  { address: 'Tisaleo',        lat: -1.3522, lon: -78.6722, city: 'Tisaleo' },
  { address: 'Mocha',          lat: -1.4167, lon: -78.6333, city: 'Mocha' },

  // ── Ciudades principales ─────────────────────────────────────
  { address: 'Guayaquil',       lat: -2.1898, lon: -79.8711, city: 'Guayaquil' },
  { address: 'Cuenca',          lat: -2.8969, lon: -79.0056, city: 'Cuenca' },
  { address: 'Ambato',          lat: -1.2264, lon: -78.6267, city: 'Ambato' },
  { address: 'Latacunga',       lat: -0.9346, lon: -78.6155, city: 'Latacunga' },
  { address: 'Riobamba',        lat: -1.6734, lon: -78.6459, city: 'Riobamba' },
  { address: 'Ibarra',          lat:  0.3505, lon: -78.1236, city: 'Ibarra' },
  { address: 'Tulcán',          lat:  0.8122, lon: -77.7176, city: 'Tulcán' },
  { address: 'Baños',           lat: -1.3969, lon: -78.4246, city: 'Baños' },
  { address: 'Guaranda',        lat: -1.5934, lon: -78.9982, city: 'Guaranda' },
  { address: 'Loja',            lat: -4.0141, lon: -79.2007, city: 'Loja' },
  { address: 'Machala',         lat: -3.2587, lon: -79.9615, city: 'Machala' },
  { address: 'Zaruma',          lat: -3.6867, lon: -79.6100, city: 'Zaruma' },
  { address: 'Manta',           lat: -0.9542, lon: -80.7319, city: 'Manta' },
  { address: 'Portoviejo',      lat: -1.0545, lon: -80.4544, city: 'Portoviejo' },
  { address: 'Esmeraldas',      lat:  0.9592, lon: -79.6533, city: 'Esmeraldas' },
  { address: 'Santo Domingo',   lat: -0.2528, lon: -79.1720, city: 'Santo Domingo' },
  { address: 'El Carmen',       lat: -0.2621, lon: -79.4592, city: 'El Carmen' },
  { address: 'Salinas',         lat: -2.2167, lon: -80.9667, city: 'Salinas' },
  { address: 'Montañita',       lat: -1.8200, lon: -80.7500, city: 'Montañita' },
  { address: 'Tena',            lat: -0.9917, lon: -77.8150, city: 'Tena' },
  { address: 'Puyo',            lat: -1.4924, lon: -78.0024, city: 'Puyo' },
  { address: 'Lago Agrio',      lat:  0.0868, lon: -76.8797, city: 'Lago Agrio' },
  { address: 'Macas',           lat: -2.3003, lon: -78.1178, city: 'Macas' },
  { address: 'Azogues',         lat: -2.7382, lon: -78.8488, city: 'Azogues' },
];

/* Mapbox Geocoding API — Ecuador only */
async function searchMapbox(query: string): Promise<Location[]> {
  if (!MAPBOX_TOKEN) {
    // No token: filter defaults as fallback
    return DEFAULT_LOCATIONS.filter(l =>
      l.address.toLowerCase().includes(query.toLowerCase())
    );
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
    + `?country=ec&language=es&limit=6&types=place,locality,neighborhood,address,poi`
    + `&access_token=${MAPBOX_TOKEN}`;

  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Mapbox geocoding failed');

  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (json.features as any[]).map((f: any) => {
    const city = f.context?.find((c: { id: string; text: string }) =>
      c.id.startsWith('place') || c.id.startsWith('locality')
    )?.text;
    return {
      address: f.place_name,
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      city,
    };
  });
}

/* GPS → dirección legible (geocodificación inversa). En ciudades donde la
   búsqueda por texto trae pocas direcciones, esto permite fijar el punto
   exacto donde está el usuario (estilo "enviar ubicación" de WhatsApp). */
async function reverseGeocodeMapbox(lat: number, lon: number): Promise<Location> {
  const fallback: Location = { address: `Mi ubicación (${lat.toFixed(5)}, ${lon.toFixed(5)})`, lat, lon };
  if (!MAPBOX_TOKEN) return fallback;
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?country=ec&language=es&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = (json.features as any[])?.[0];
    if (!f) return fallback;
    const city = f.context?.find((c: { id: string; text: string }) =>
      c.id.startsWith('place') || c.id.startsWith('locality'))?.text;
    return { address: f.place_name, lat, lon, city };
  } catch { return fallback; }
}

/* ── Search Box API (suggest + retrieve) ──────────────────────────────────
   Mejor autocompletado de POIs/negocios que el geocoding v5, ideal para
   ciudades donde hay pocas direcciones "postales". Flujo en 2 pasos:
   suggest (devuelve mapbox_id) → retrieve (devuelve coordenadas). */
interface Suggestion extends Location { mapboxId?: string; title?: string; subtitle?: string; }
const SEARCHBOX = 'https://api.mapbox.com/search/searchbox/v1';

async function searchBoxSuggest(q: string, sessionToken: string, prox: { lat: number; lon: number }): Promise<Suggestion[]> {
  if (!MAPBOX_TOKEN) return [];
  const url = `${SEARCHBOX}/suggest?q=${encodeURIComponent(q)}&language=es&country=ec&limit=6`
    + `&proximity=${prox.lon},${prox.lat}&session_token=${sessionToken}&access_token=${MAPBOX_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('searchbox suggest failed');
  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((json.suggestions as any[]) ?? []).map((s: any) => ({
    address: s.full_address || s.place_formatted || s.name,
    lat: 0, lon: 0,
    mapboxId: s.mapbox_id,
    title: s.name,
    subtitle: s.full_address || s.place_formatted || '',
  }));
}

async function searchBoxRetrieve(mapboxId: string, sessionToken: string): Promise<Location | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const url = `${SEARCHBOX}/retrieve/${mapboxId}?session_token=${sessionToken}&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const f = (json.features as any[])?.[0];
    if (!f?.geometry?.coordinates) return null;
    const [lon, lat] = f.geometry.coordinates;
    return { address: f.properties?.full_address || f.properties?.name || '', lat, lon, city: f.properties?.context?.place?.name };
  } catch { return null; }
}

function newSessionToken(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

export function LocationSelector({ type, value, onChange, placeholder }: LocationSelectorProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const sessionToken = useRef<string>(newSessionToken());
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [pickCoords, setPickCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [confirmingMap, setConfirmingMap] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const label = type === 'pickup' ? '🟢 Recogida' : '🔴 Destino';
  const dotColor = type === 'pickup' ? '#22c55e' : '#ef4444';
  const defaultPlaceholder = placeholder || (type === 'pickup'
    ? '¿De dónde sales?'
    : '¿Hacia dónde vas?');

  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  /* Guardadas (backend, mapeadas) + recientes (localStorage), tope 6. */
  const buildEntries = (saved: SavedAddress[]): SavedEntry[] => {
    const savedE: SavedEntry[] = saved.map((a) => ({
      label: a.label, icon: iconForType(a.type), address: a.address, lat: a.latitude, lon: a.longitude,
    }));
    const recent = loadStored('going_recent_addresses');
    return [...savedE, ...recent.filter(r => !savedE.find(s => s.address === r.address))].slice(0, 6);
  };

  /* Cargar guardadas (backend, fuente única) + recientes al montar */
  useEffect(() => {
    let alive = true;
    loadSavedAddresses().then((list) => { if (alive) setSavedEntries(buildEntries(list)); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Guardar la ubicación elegida como Casa/Trabajo/favorito (semiautomático). */
  const handleSaveAs = async (t: SavedAddressType) => {
    if (!value) return;
    let label = t === 'home' ? 'Casa' : t === 'work' ? 'Trabajo' : '';
    if (t === 'favorite') {
      const name = typeof window !== 'undefined'
        ? window.prompt('Nombre del lugar (ej. Mamá, Gimnasio):', '')
        : '';
      if (!name || !name.trim()) return;
      label = name.trim().slice(0, 40);
    }
    const list = await upsertSavedAddress({
      type: t, label, address: value.address, latitude: value.lat, longitude: value.lon,
    });
    setSavedEntries(buildEntries(list));
    setSavedFlash(label);
    setTimeout(() => setSavedFlash(null), 2200);
  };

  /* Close on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchLocations = async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions(DEFAULT_LOCATIONS.slice(0, 6));
      setError(null);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      // Sesgo de proximidad: a la ubicación ya elegida, o a Quito por defecto.
      const prox = value?.lat ? { lat: value.lat, lon: value.lon } : { lat: -0.1807, lon: -78.4678 };
      // 1º Search Box (mejores POIs); si no hay resultados, geocoding v5.
      let locations: Suggestion[] = [];
      try { locations = await searchBoxSuggest(query, sessionToken.current, prox); } catch { locations = []; }
      if (locations.length === 0) locations = await searchMapbox(query);
      // Lugares curados (aeropuerto, ciudades clave) con nombre limpio van
      // ARRIBA de los POIs de Mapbox — que para el aeropuerto devuelven
      // etiquetas feas tipo "Salida Nacional, Quito Pichincha 1709".
      const q = query.trim().toLowerCase();
      const curated: Suggestion[] = DEFAULT_LOCATIONS
        .filter((l) => l.address.toLowerCase().includes(q) || (l.city?.toLowerCase().includes(q) ?? false))
        .map((l) => ({
          ...l,
          title: l.address,
          subtitle: l.city && l.city.toLowerCase() !== l.address.toLowerCase() ? `${l.city}, Ecuador` : 'Ecuador',
        }));
      const combined = [
        ...curated,
        ...locations.filter((m) => !curated.some((c) => c.address.toLowerCase() === m.address.toLowerCase())),
      ];
      if (combined.length === 0) {
        setSuggestions([]);
        setError('No se encontraron ubicaciones');
      } else {
        setSuggestions(combined);
        setError(null);
      }
    } catch {
      // Fallback to filtered defaults on error
      const fallback = DEFAULT_LOCATIONS.filter(l =>
        l.address.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(fallback);
      if (fallback.length === 0) setError('Error al buscar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowSuggestions(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => fetchLocations(val), 350);
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
    if (!input.trim()) setSuggestions(DEFAULT_LOCATIONS.slice(0, 6));
  };

  const handleSelectSaved = (entry: SavedEntry) => {
    const loc: Location = { address: entry.address, lat: entry.lat, lon: entry.lon };
    onChange(loc);
    setInput(entry.address);
    setShowSuggestions(false);
  };

  const handleSelect = async (location: Suggestion) => {
    let resolved: Location = location;
    // Search Box: resolver coordenadas reales con retrieve antes de fijar.
    if (location.mapboxId && !location.lat) {
      const r = await searchBoxRetrieve(location.mapboxId, sessionToken.current);
      if (r) resolved = r;
    }
    onChange(resolved);
    setInput(resolved.address);
    setShowSuggestions(false);
    setSuggestions([]);
    setError(null);
    sessionToken.current = newSessionToken(); // nueva sesión tras seleccionar
  };

  const handleClear = () => {
    setInput('');
    setSuggestions(DEFAULT_LOCATIONS.slice(0, 6));
    setShowSuggestions(true);
    setError(null);
  };

  /* "Enviar mi ubicación actual" (GPS) — para fijar el punto exacto cuando la
     búsqueda por texto no encuentra la dirección en la ciudad. */
  const handleUseGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Tu navegador no soporta ubicación'); setShowSuggestions(true); return;
    }
    setGpsLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await reverseGeocodeMapbox(pos.coords.latitude, pos.coords.longitude);
        handleSelect(loc);
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setShowSuggestions(true);
        setError(err.code === err.PERMISSION_DENIED
          ? 'Permiso de ubicación denegado. Actívalo en el navegador.'
          : 'No pudimos detectar tu ubicación. Escríbela manualmente.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  /* Confirmar el punto elegido en el mapa → geocodificación inversa + select. */
  const handleConfirmMap = async () => {
    if (!pickCoords) return;
    setConfirmingMap(true);
    const loc = await reverseGeocodeMapbox(pickCoords.lat, pickCoords.lon);
    handleSelect(loc);
    setShowMap(false);
    setPickCoords(null);
    setConfirmingMap(false);
  };

  useEffect(() => () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); }, []);

  return (
    <div ref={wrapperRef} className="w-full">
      {/* Chips de guardadas/recientes — solo cuando el campo está vacío */}
      {savedEntries.length > 0 && !value && !input && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
          {savedEntries.map((e, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectSaved(e)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-[#0033A0] rounded-xl text-xs font-medium text-gray-600 hover:text-[#0033A0] transition-colors"
            >
              <span>{e.icon}</span>
              <span className="max-w-[90px] truncate">{e.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        {/* Punto de color al inicio del input */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm z-10"
             style={{ backgroundColor: dotColor }} />

        <input
          type="text"
          value={input || value?.address || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={defaultPlaceholder}
          className="w-full pl-9 pr-10 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0033A0] focus:border-transparent transition-all bg-gray-50 focus:bg-white text-sm text-gray-800 placeholder-gray-400"
          data-testid={`${type}-location-input`}
        />

        {value && !isLoading && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 transition flex items-center justify-center text-xs font-bold"
            aria-label="Limpiar"
          >
            ✕
          </button>
        )}

        {isLoading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#0033A0] rounded-full animate-spin" />
          </div>
        )}

        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">

            {/* Enviar mi ubicación actual (GPS, estilo WhatsApp) — solo origen */}
            {type === 'pickup' && (
              <button type="button" onClick={handleUseGps} disabled={gpsLoading}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-100 disabled:opacity-60">
                <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF', color: '#0033A0' }}>
                  {gpsLoading
                    ? <span className="w-4 h-4 border-2 border-[#0033A0]/30 border-t-[#0033A0] rounded-full animate-spin" />
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0033A0]">{gpsLoading ? 'Detectando tu ubicación…' : 'Usar mi ubicación actual'}</p>
                  <p className="text-xs text-gray-400">Fija el punto exacto donde estás (GPS)</p>
                </div>
              </button>
            )}

            {/* Fijar punto exacto en el mapa (pin arrastrable) — origen y destino */}
            <button type="button" onClick={() => { setShowMap(true); setShowSuggestions(false); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100">
              <span className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-800">Fijar punto en el mapa</p>
                <p className="text-xs text-gray-400">Arrastra el pin al lugar exacto</p>
              </div>
            </button>

            {/* Sección: Guardadas */}
            {!input.trim() && savedEntries.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recientes</p>
                </div>
                {savedEntries.map((e, i) => (
                  <button key={`saved-${i}`} type="button" onClick={() => handleSelectSaved(e)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <span className="text-base">{e.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{e.label}</p>
                      <p className="text-xs text-gray-400 truncate">{e.address}</p>
                    </div>
                  </button>
                ))}
                {suggestions.length > 0 && <div className="border-t border-gray-100 mx-4 my-1" />}
              </>
            )}

            {/* Sección: Resultados de búsqueda */}
            {suggestions.length > 0 && (
              <>
                {input.trim() && (
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resultados</p>
                  </div>
                )}
                {suggestions.slice(0, 6).map((location, i) => (
                  <button key={i} type="button" onClick={() => handleSelect(location)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors flex items-center gap-3 last:mb-1">
                    <span className="text-base">📍</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {location.title || location.city || location.address.split(',')[0]}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{location.subtitle || location.address}</p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {error && <div className="px-4 py-3 text-sm text-red-600">{error}</div>}

            {!error && suggestions.length === 0 && savedEntries.length === 0 && !isLoading && (
              <div className="px-4 py-4 text-sm text-gray-400 text-center">Sin resultados</div>
            )}

            {!MAPBOX_TOKEN && (
              <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
                ⚠️ Configura NEXT_PUBLIC_MAPBOX_TOKEN para búsqueda completa
              </div>
            )}
          </div>
        )}
      </div>

      {/* Guardar la ubicación elegida (Casa/Trabajo/otro) — semiautomático */}
      {value && !showMap && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {savedFlash ? (
            <span className="text-xs font-semibold text-green-600">✓ Guardado como {savedFlash}</span>
          ) : (
            <>
              <span className="text-xs text-gray-400">Guardar como:</span>
              {([
                { t: 'home' as const, txt: '🏠 Casa' },
                { t: 'work' as const, txt: '💼 Trabajo' },
                { t: 'favorite' as const, txt: '⭐ Otro' },
              ]).map(({ t, txt }) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleSaveAs(t)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:border-[#0033A0] hover:text-[#0033A0] transition-colors"
                >
                  {txt}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Panel del mapa para fijar el punto exacto (pin arrastrable) */}
      {showMap && (
        <div className="mt-2 rounded-2xl border border-gray-200 p-2 bg-white shadow-sm">
          <MapPicker
            value={value ?? pickCoords ?? undefined}
            accent={dotColor}
            onPick={(lat, lon) => setPickCoords({ lat, lon })}
          />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => { setShowMap(false); setPickCoords(null); }}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50">
              Cancelar
            </button>
            <button type="button" onClick={handleConfirmMap} disabled={!pickCoords || confirmingMap}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50" style={{ backgroundColor: '#0033A0' }}>
              {confirmingMap ? 'Fijando…' : 'Confirmar ubicación'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
