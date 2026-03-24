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

/* Default Ecuador cities — fallback when no query or no token */
const DEFAULT_LOCATIONS: Location[] = [
  { address: 'Quito, Ecuador', lat: -0.2299, lon: -78.5099, city: 'Quito' },
  { address: 'Guayaquil, Ecuador', lat: -2.1898, lon: -79.8711, city: 'Guayaquil' },
  { address: 'Cuenca, Ecuador', lat: -2.8969, lon: -79.0056, city: 'Cuenca' },
  { address: 'Ambato, Ecuador', lat: -1.2264, lon: -78.6267, city: 'Ambato' },
  { address: 'Loja, Ecuador', lat: -4.0141, lon: -79.2007, city: 'Loja' },
  { address: 'Riobamba, Ecuador', lat: -1.6734, lon: -78.6459, city: 'Riobamba' },
  { address: 'Machala, Ecuador', lat: -3.2587, lon: -79.9615, city: 'Machala' },
  { address: 'Ibarra, Ecuador', lat: 0.3505, lon: -78.1236, city: 'Ibarra' },
  { address: 'Portoviejo, Ecuador', lat: -1.0545, lon: -80.4544, city: 'Portoviejo' },
  { address: 'Manta, Ecuador', lat: -0.9542, lon: -80.7319, city: 'Manta' },
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
