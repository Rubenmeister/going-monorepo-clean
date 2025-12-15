'use client';

import React from 'react';

export interface VehicleLocation {
  lat: number;
  lng: number;
  heading?: number;
}

export interface TripRoute {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  currentPosition?: VehicleLocation;
  eta?: string;
  distance?: string;
}

interface TrackingMapPanelProps {
  trip: TripRoute;
  driverName?: string;
  vehicleType?: 'car' | 'minivan' | 'motorcycle';
  status?: 'en_route_pickup' | 'arrived_pickup' | 'en_route_destination' | 'arrived';
  onRefresh?: () => void;
  className?: string;
}

const statusLabels = {
  en_route_pickup: 'En camino a recogerte',
  arrived_pickup: 'Ha llegado',
  en_route_destination: 'En camino al destino',
  arrived: 'Has llegado',
};

const vehicleEmojis = {
  car: '🚗',
  minivan: '🚐',
  motorcycle: '🏍️',
};

export function TrackingMapPanel({
  trip,
  driverName,
  vehicleType = 'car',
  status = 'en_route_pickup',
  onRefresh,
  className = '',
}: TrackingMapPanelProps) {
  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 bg-white ${className}`}>
      {/* Map Placeholder */}
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
        
        {/* Route visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-3/4 h-1 bg-going-red/30 rounded-full">
            {/* Origin */}
            <div className="absolute left-0 -top-3 w-6 h-6 bg-going-red rounded-full flex items-center justify-center text-white text-xs shadow-lg">
              A
            </div>
            
            {/* Vehicle (current position) */}
            <div 
              className="absolute -top-4 transition-all duration-1000"
              style={{ left: status === 'arrived' ? '100%' : status === 'en_route_destination' ? '60%' : '30%' }}
            >
              <span className="text-2xl drop-shadow-lg">{vehicleEmojis[vehicleType]}</span>
            </div>
            
            {/* Destination */}
            <div className="absolute right-0 -top-3 w-6 h-6 bg-going-yellow rounded-full flex items-center justify-center text-going-black text-xs font-bold shadow-lg">
              B
            </div>
          </div>
        </div>
        
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
        
        {/* Map SDK placeholder message */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500">
          📍 Mapbox / Google Maps SDK
        </div>
      </div>
      
      {/* Info Panel */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className={`
              inline-block w-2 h-2 rounded-full
              ${status === 'arrived' ? 'bg-green-500' : 'bg-going-red animate-pulse'}
            `} />
            <span className="font-medium text-gray-900">{statusLabels[status]}</span>
          </div>
          {trip.eta && (
            <span className="text-going-red font-semibold">{trip.eta}</span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-going-red" />
            <span className="truncate max-w-32">{trip.origin.name}</span>
          </div>
          <span>→</span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-going-yellow" />
            <span className="truncate max-w-32">{trip.destination.name}</span>
          </div>
        </div>
        
        {driverName && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
              {vehicleEmojis[vehicleType]}
            </div>
            <div>
              <p className="font-medium text-gray-900">{driverName}</p>
              <p className="text-xs text-gray-500">Tu conductor</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackingMapPanel;
