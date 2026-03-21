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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const label = type === 'pickup' ? '🟢 Recogida' : '🔴 Destino';
  const defaultPlaceholder = placeholder || (type === 'pickup'
    ? 'Buscar ubicación de recogida...'
    : 'Buscar ubicación de destino...');

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
    <div ref={wrapperRef} className="relative w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={input || value?.address || ''}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={defaultPlaceholder}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4c41] focus:border-transparent transition-all"
          style={{ outline: 'none' }}
          data-testid={`${type}-location-input`}
        />

        {value && !isLoading && (
          <button type="button" onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
            aria-label="Limpiar">
            ✕
          </button>
        )}

        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-200 border-t-[#ff4c41] rounded-full animate-spin" />
          </div>
        )}

        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            {!MAPBOX_TOKEN && (
              <div className="px-3 py-2 text-xs text-amber-700 bg-amber-50 border-b border-amber-100 flex items-center gap-1.5">
                ⚠️ Agrega <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> para búsqueda completa
              </div>
            )}

            {error && <div className="px-4 py-3 text-sm text-red-600 bg-red-50">{error}</div>}

            {!error && suggestions.length === 0 && !isLoading && (
              <div className="px-4 py-3 text-sm text-gray-500">Sin resultados</div>
            )}

            {suggestions.map((location, i) => (
              <button key={i} type="button" onClick={() => handleSelect(location)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm">{type === 'pickup' ? '🟢' : '🔴'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {location.city || location.address.split(',')[0]}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{location.address}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
