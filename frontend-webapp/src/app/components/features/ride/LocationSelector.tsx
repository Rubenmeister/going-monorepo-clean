'use client';

import { useState, useEffect, useRef } from 'react';
import type { Location } from '@/types';

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
  { address: 'Aeropuerto Quito (Tababela)', lat: -0.1292, lon: -78.3575, city: 'Quito' },

  // ── Ciudades intermedias en rutas hacia Quito ───────────────
  { address: 'Guayllabamba',   lat: -0.0494, lon: -78.3692, city: 'Guayllabamba' },
  { address: 'Cayambe',        lat:  0.0423, lon: -78.1368, city: 'Cayambe' },
  { address: 'Tabacundo',      lat:  0.0454, lon: -78.2025, city: 'Tabacundo' },
  { address: 'El Quinche',     lat: -0.1012, lon: -78.3136, city: 'El Quinche' },
  { address: 'Pifo',           lat: -0.2279, lon: -78.3520, city: 'Pifo' },
  { address: 'Machachi',       lat: -0.5104, lon: -78.5698, city: 'Machachi' },
  { address: 'Tambillo',       lat: -0.4360, lon: -78.5598, city: 'Tambillo' },
  { address: 'Aloasí',         lat: -0.5300, lon: -78.5700, city: 'Aloasí' },
  { address: 'Otavalo',        lat:  0.2342, lon: -78.2637, city: 'Otavalo' },
  { address: 'Cotacachi',      lat:  0.3049, lon: -78.2656, city: 'Cotacachi' },

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

export function LocationSelector({ type, value, onChange, placeholder }: LocationSelectorProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const label = type === 'pickup' ? '🟢 Recogida' : '🔴 Destino';
  const dotColor = type === 'pickup' ? '#22c55e' : '#ef4444';
  const defaultPlaceholder = placeholder || (type === 'pickup'
    ? '¿De dónde sales?'
    : '¿Hacia dónde vas?');

  /* Cargar guardadas + recientes al montar */
  useEffect(() => {
    const saved   = loadStored('going_saved_addresses');
    const recent  = loadStored('going_recent_addresses');
    const merged  = [...saved, ...recent.filter(r => !saved.find(s => s.address === r.address))].slice(0, 6);
    setSavedEntries(merged);
  }, []);

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
      const locations = await searchMapbox(query);
      if (locations.length === 0) {
        setSuggestions([]);
        setError('No se encontraron ubicaciones');
      } else {
        setSuggestions(locations);
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

  const handleSelect = (location: Location) => {
    onChange(location);
    setInput(location.address);
    setShowSuggestions(false);
    setSuggestions([]);
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setSuggestions(DEFAULT_LOCATIONS.slice(0, 6));
    setShowSuggestions(true);
    setError(null);
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
                        {location.city || location.address.split(',')[0]}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{location.address}</p>
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
    </div>
  );
}
