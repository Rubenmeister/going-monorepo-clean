'use client';

import React from 'react';

export type EcuadorRegion = 'costa' | 'sierra' | 'amazonia' | 'galapagos';

interface RegionChipsProps {
  value?: EcuadorRegion | null;
  onChange?: (region: EcuadorRegion | null) => void;
  showAll?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const regions: { id: EcuadorRegion; label: string; emoji: string; color: string }[] = [
  { id: 'costa', label: 'Costa', emoji: '🏖️', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: 'sierra', label: 'Sierra', emoji: '🏔️', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'amazonia', label: 'Amazonía', emoji: '🌴', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'galapagos', label: 'Galápagos', emoji: '🐢', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

export function RegionChips({
  value,
  onChange,
  showAll = true,
  size = 'md',
  className = '',
}: RegionChipsProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {showAll && (
        <button
          onClick={() => onChange?.(null)}
          className={`
            inline-flex items-center rounded-full border transition
            ${sizeClasses[size]}
            ${value === null 
              ? 'bg-going-red text-white border-going-red' 
              : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
            }
          `}
        >
          🇪🇨 Todo Ecuador
        </button>
      )}
      {regions.map((region) => (
        <button
          key={region.id}
          onClick={() => onChange?.(region.id)}
          className={`
            inline-flex items-center rounded-full border transition
            ${sizeClasses[size]}
            ${value === region.id 
              ? 'bg-going-red text-white border-going-red' 
              : `${region.color} hover:opacity-80`
            }
          `}
        >
          <span>{region.emoji}</span>
          <span>{region.label}</span>
        </button>
      ))}
    </div>
  );
}

// Popular routes for Ecuador
export interface PopularRoute {
  id: string;
  from: string;
  to: string;
  region: EcuadorRegion;
  duration?: string;
}

const POPULAR_ROUTES: PopularRoute[] = [
  { id: 'uio-gye', from: 'Quito', to: 'Guayaquil', region: 'sierra', duration: '8h' },
  { id: 'uio-cue', from: 'Quito', to: 'Cuenca', region: 'sierra', duration: '10h' },
  { id: 'gye-mec', from: 'Guayaquil', to: 'Manta', region: 'costa', duration: '3h' },
  { id: 'uio-airport', from: 'Quito Centro', to: 'Aeropuerto', region: 'sierra', duration: '45min' },
  { id: 'gye-airport', from: 'Guayaquil Centro', to: 'Aeropuerto', region: 'costa', duration: '20min' },
  { id: 'gps-isla', from: 'Santa Cruz', to: 'Isabela', region: 'galapagos', duration: '2h' },
];

interface PopularRoutesProps {
  onSelect?: (route: PopularRoute) => void;
  region?: EcuadorRegion | null;
  limit?: number;
  className?: string;
}

export function PopularRoutes({
  onSelect,
  region,
  limit = 4,
  className = '',
}: PopularRoutesProps) {
  const filteredRoutes = region 
    ? POPULAR_ROUTES.filter(r => r.region === region) 
    : POPULAR_ROUTES;
  
  const displayRoutes = filteredRoutes.slice(0, limit);

  return (
    <div className={className}>
      <h4 className="text-sm font-medium text-gray-500 mb-3">Rutas populares</h4>
      <div className="space-y-2">
        {displayRoutes.map((route) => (
          <button
            key={route.id}
            onClick={() => onSelect?.(route)}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-going-red">📍</span>
              <span className="text-gray-900">
                {route.from} → {route.to}
              </span>
            </div>
            {route.duration && (
              <span className="text-sm text-gray-400">{route.duration}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RegionChips;
