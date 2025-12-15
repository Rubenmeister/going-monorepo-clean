'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface Location {
  id: string;
  name: string;
  address?: string;
  region?: 'costa' | 'sierra' | 'amazonia' | 'galapagos';
  coordinates?: { lat: number; lng: number };
}

interface SearchFromToProps {
  fromValue?: Location | null;
  toValue?: Location | null;
  onFromChange: (location: Location | null) => void;
  onToChange: (location: Location | null) => void;
  onSearch?: (from: Location, to: Location) => void;
  placeholder?: { from: string; to: string };
  suggestions?: Location[];
  loading?: boolean;
  className?: string;
}

// Ecuador locations mock data
const ECUADOR_LOCATIONS: Location[] = [
  { id: 'uio-airport', name: 'Aeropuerto Mariscal Sucre', address: 'Tababela, Quito', region: 'sierra' },
  { id: 'uio-centro', name: 'Centro Histórico', address: 'Quito', region: 'sierra' },
  { id: 'uio-carolina', name: 'Parque La Carolina', address: 'Quito', region: 'sierra' },
  { id: 'gye-airport', name: 'Aeropuerto José Joaquín de Olmedo', address: 'Guayaquil', region: 'costa' },
  { id: 'gye-malecon', name: 'Malecón 2000', address: 'Guayaquil', region: 'costa' },
  { id: 'cue-centro', name: 'Centro Histórico', address: 'Cuenca', region: 'sierra' },
  { id: 'mec-playa', name: 'Playa de Manta', address: 'Manta', region: 'costa' },
  { id: 'gps-santa-cruz', name: 'Puerto Ayora', address: 'Santa Cruz, Galápagos', region: 'galapagos' },
];

export function SearchFromTo({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  onSearch,
  placeholder = { from: '¿Desde dónde?', to: '¿Hacia dónde?' },
  suggestions = ECUADOR_LOCATIONS,
  loading = false,
  className = '',
}: SearchFromToProps) {
  const [fromQuery, setFromQuery] = useState(fromValue?.name || '');
  const [toQuery, setToQuery] = useState(toValue?.name || '');
  const [activeField, setActiveField] = useState<'from' | 'to' | null>(null);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Location[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = activeField === 'from' ? fromQuery : toQuery;
    if (query.length > 0) {
      const filtered = suggestions.filter(
        loc => loc.name.toLowerCase().includes(query.toLowerCase()) ||
               loc.address?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions(suggestions.slice(0, 5));
    }
  }, [fromQuery, toQuery, activeField, suggestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (location: Location) => {
    if (activeField === 'from') {
      setFromQuery(location.name);
      onFromChange(location);
      setActiveField('to');
    } else {
      setToQuery(location.name);
      onToChange(location);
      setActiveField(null);
      if (fromValue && onSearch) {
        onSearch(fromValue, location);
      }
    }
  };

  const swapLocations = () => {
    const tempFrom = fromValue;
    const tempQuery = fromQuery;
    setFromQuery(toQuery);
    setToQuery(tempQuery);
    onFromChange(toValue || null);
    onToChange(tempFrom || null);
  };

  const regionColors = {
    costa: 'bg-blue-100 text-blue-700',
    sierra: 'bg-green-100 text-green-700',
    amazonia: 'bg-emerald-100 text-emerald-700',
    galapagos: 'bg-amber-100 text-amber-700',
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-stretch bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* From Input */}
        <div className="flex-1 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <span className="w-3 h-3 rounded-full bg-going-red block" />
          </div>
          <input
            type="text"
            value={fromQuery}
            onChange={(e) => {
              setFromQuery(e.target.value);
              if (!e.target.value) onFromChange(null);
            }}
            onFocus={() => setActiveField('from')}
            placeholder={placeholder.from}
            className="w-full pl-10 pr-4 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Swap Button */}
        <button
          onClick={swapLocations}
          className="px-2 flex items-center justify-center text-gray-400 hover:text-going-red transition"
          title="Intercambiar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-px bg-gray-200" />

        {/* To Input */}
        <div className="flex-1 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <span className="w-3 h-3 rounded-full bg-going-yellow block" />
          </div>
          <input
            type="text"
            value={toQuery}
            onChange={(e) => {
              setToQuery(e.target.value);
              if (!e.target.value) onToChange(null);
            }}
            onFocus={() => setActiveField('to')}
            placeholder={placeholder.to}
            className="w-full pl-10 pr-4 py-4 text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {activeField && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="w-5 h-5 border-2 border-going-red border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredSuggestions.length > 0 ? (
            <ul>
              {filteredSuggestions.map((location) => (
                <li key={location.id}>
                  <button
                    onClick={() => handleSelect(location)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 transition"
                  >
                    <span className="text-xl">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{location.name}</p>
                      {location.address && (
                        <p className="text-sm text-gray-500 truncate">{location.address}</p>
                      )}
                    </div>
                    {location.region && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${regionColors[location.region]}`}>
                        {location.region.charAt(0).toUpperCase() + location.region.slice(1)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No se encontraron ubicaciones
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchFromTo;
