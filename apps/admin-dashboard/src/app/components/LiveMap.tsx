'use client';

import React, { useState } from 'react';
import { DashboardEntity, ALL_ENTITIES, EntityStatus } from '../mocks/dashboard-data';

interface LiveMapProps {
  entities?: DashboardEntity[];
  activeTrips?: { id: string; route: { start: [number, number]; end: [number, number] } }[];
  onEntityClick?: (entityId: string) => void;
  onTripClick?: (tripId: string) => void;
  focusedEntityId?: string;
  focusedTripId?: string;
  className?: string;
}

const entityIcons: Record<string, string> = {
  driver: '🚗',
  courier: '🏍️',
  tour_guide: '🚩',
  host: '🏠',
  creator: '🎨'
};

const statusColors: Record<EntityStatus, string> = {
  active: '#00c853',
  idle: '#ffd253',
  warning: '#ff9800',
  critical: '#ff4c41',
  offline: '#666666',
};

export function LiveMap({
  entities = ALL_ENTITIES,
  onEntityClick,
  onTripClick,
  focusedEntityId,
  focusedTripId,
  className = '',
}: LiveMapProps) {
  const [clustered, setClustered] = useState(true);
  const [lastUpdate] = useState(new Date());

  const activeCount = entities.filter(e => e.status === 'active').length;
  const criticalCount = entities.filter(e => e.status === 'critical').length;

  return (
    <div className={`bg-surface rounded-lg border border-border overflow-hidden ${className}`}>
      {/* Map Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-4">
          <h3 className="font-heading font-semibold text-white">Mapa en Tiempo Real</h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-going-red"></span>
              <span className="text-white/60">{activeCount} activos</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span className="text-white/60">{criticalCount} críticos</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setClustered(!clustered)}
            className={`px-3 py-1 text-xs rounded ${
              clustered ? 'bg-going-red text-white' : 'bg-charcoal text-white/60'
            }`}
          >
            Clustering
          </button>
          <span className="text-[10px] text-white/40">
            Actualizado hace {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s
          </span>
        </div>
      </div>

      {/* Map Placeholder */}
      <div className="relative h-[400px] bg-[#1a1a2e]">
        {/* Grid pattern to simulate map */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,76,65,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,76,65,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />

        {/* Urban pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 30h60M30 0v60' stroke='%23ff4c41' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Entity markers */}
        {entities.map((entity, i) => {
          const isFocused = focusedEntityId && entity.id === focusedEntityId;
          const opacity = focusedEntityId && !isFocused ? 0.3 : 1;

          // Position entities (simulated coords)
          // We can use the mock coords, mapped to % for this container
          // Quito Center roughly: -0.18, -78.48. Range ~0.05 deg for demo
          const latOffset = (entity.location.lat - (-0.1807)) * 1000; 
          const lngOffset = (entity.location.lng - (-78.4678)) * 1000;
          
          // Center the offsets in the container (50% + offset)
          // Scaling factor to spread them out
          const x = 50 + lngOffset * 2; 
          const y = 50 + latOffset * 2;

          return (
            <button
              key={entity.id}
              onClick={() => {
                onEntityClick?.(entity.id);
              }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                isFocused ? 'scale-125 z-20' : 'hover:scale-110 z-10'
              }`}
              style={{ left: `${Math.min(max(x, 5), 95)}%`, top: `${Math.min(max(y, 5), 95)}%`, opacity }}
            >
              <div
                className={`relative p-2 rounded-full text-lg shadow-lg border border-white/10 ${
                  entity.status === 'active' ? 'bg-charcoal' : 'bg-charcoal/80'
                }`}
              >
                <span>{entityIcons[entity.type] || '📍'}</span>
                <span
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-surface animate-pulse"
                  style={{ backgroundColor: statusColors[entity.status] }}
                />
              </div>
              {isFocused && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-going-red text-white text-xs rounded whitespace-nowrap z-30 shadow-xl">
                  {entity.name}
                </div>
              )}
            </button>
          );
        })}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-charcoal/90 backdrop-blur-sm rounded-lg p-3 border border-border">
          <div className="space-y-1 text-xs">
            {Object.entries(entityIcons).map(([type, icon]) => (
              <div key={type} className="flex items-center gap-2">
                <span>{icon}</span>
                <span className="text-white/60 capitalize">{type.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function max(a: number, b: number) { return a > b ? a : b; }

