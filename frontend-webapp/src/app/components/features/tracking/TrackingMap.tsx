'use client';

import { useEffect, useRef, useState } from 'react';
import { useRideStore } from '@/stores/rideStore';

/* ─────────────────────────────────────────────
   Mapbox GL JS via CDN — no npm install needed
   Token from NEXT_PUBLIC_MAPBOX_TOKEN
   ───────────────────────────────────────────── */
declare global {
  interface Window {
    mapboxgl: {
      Map: new (options: Record<string, unknown>) => MapboxMap;
      Marker: new (options?: Record<string, unknown>) => MapboxMarker;
      LngLatBounds: new () => MapboxBounds;
      accessToken: string;
    };
  }
}

interface MapboxMap {
  on(event: string, fn: () => void): void;
  fitBounds(bounds: MapboxBounds, options?: Record<string, unknown>): void;
  remove(): void;
}
interface MapboxMarker {
  setLngLat(coord: [number, number]): this;
  addTo(map: MapboxMap): this;
  setPopup(popup: unknown): this;
  getElement(): HTMLElement;
}
interface MapboxBounds {
  extend(coord: [number, number]): this;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

function loadMapbox(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.mapboxgl) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (!document.querySelector('#mapbox-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
      document.head.appendChild(link);
    }
    if (!document.querySelector('#mapbox-js')) {
      const script = document.createElement('script');
      script.id = 'mapbox-js';
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'));
      document.head.appendChild(script);
    } else {
      resolve();
    }
  });
}

/* ─────────────────────────────────────────────
   MAP COMPONENT
   ───────────────────────────────────────────── */
interface MapProps {
  pickup: { lat: number; lon: number; label?: string };
  dropoff: { lat: number; lon: number; label?: string };
  driverLocation?: { lat: number; lon: number };
  distance?: number;
  duration?: number;
}

export function MapboxMap({ pickup, dropoff, driverLocation, distance, duration }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const driverMarkerRef = useRef<MapboxMarker | null>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const noToken = !MAPBOX_TOKEN;

  useEffect(() => {
    loadMapbox()
      .then(() => setReady(true))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current || noToken) return;

    const mbgl = window.mapboxgl;
    mbgl.accessToken = MAPBOX_TOKEN;

    const map = new mbgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [(pickup.lon + dropoff.lon) / 2, (pickup.lat + dropoff.lat) / 2],
      zoom: 12,
      scrollZoom: false,
    });

    map.on('load', () => {
      /* Pickup marker — green pin */
      const pickupEl = document.createElement('div');
      pickupEl.innerHTML = `<div style="
        width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:#10b981;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      "></div>`;
      new mbgl.Marker({ element: pickupEl })
        .setLngLat([pickup.lon, pickup.lat])
        .addTo(map);

      /* Dropoff marker — red pin */
      const dropoffEl = document.createElement('div');
      dropoffEl.innerHTML = `<div style="
        width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:#ef4444;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      "></div>`;
      new mbgl.Marker({ element: dropoffEl })
        .setLngLat([dropoff.lon, dropoff.lat])
        .addTo(map);

      /* Driver marker — Going brand */
      const driverEl = document.createElement('div');
      driverEl.innerHTML = `<div style="
        width:32px;height:32px;border-radius:50%;background:#ff4c41;
        border:3px solid white;box-shadow:0 2px 12px rgba(255,76,65,0.5);
        display:flex;align-items:center;justify-content:center;font-size:16px;
      ">🚗</div>`;
      const driverLat = driverLocation?.lat ?? pickup.lat;
      const driverLon = driverLocation?.lon ?? pickup.lon;
      const driverMarker = new mbgl.Marker({ element: driverEl })
        .setLngLat([driverLon, driverLat])
        .addTo(map);
      driverMarkerRef.current = driverMarker;

      /* Route line using Mapbox Directions or simple straight line */
      (map as unknown as {
        addSource: (id: string, src: unknown) => void;
        addLayer: (layer: unknown) => void;
      }).addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [pickup.lon, pickup.lat],
              [driverLon, driverLat],
              [dropoff.lon, dropoff.lat],
            ],
          },
        },
      });
      (map as unknown as { addLayer: (layer: unknown) => void }).addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ff4c41',
          'line-width': 4,
          'line-dasharray': [2, 2],
          'line-opacity': 0.75,
        },
      });

      /* Fit to bounds */
      const bounds = new mbgl.LngLatBounds();
      bounds.extend([pickup.lon, pickup.lat]);
      bounds.extend([dropoff.lon, dropoff.lat]);
      bounds.extend([driverLon, driverLat]);
      map.fitBounds(bounds, { padding: 50 });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* Live driver position updates */
  useEffect(() => {
    if (!driverMarkerRef.current || !driverLocation) return;
    driverMarkerRef.current.setLngLat([driverLocation.lon, driverLocation.lat]);
  }, [driverLocation?.lat, driverLocation?.lon]);

  /* ── No token ── */
  if (noToken) {
    return (
      <div className="rounded-2xl overflow-hidden mb-4" style={{ height: 280, background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
          <span className="text-4xl">🗺️</span>
          <p className="text-white font-semibold">Mapa Mapbox</p>
          <p className="text-gray-400 text-xs max-w-xs">
            Agrega <code className="bg-gray-800 px-1 rounded text-[#ff4c41]">NEXT_PUBLIC_MAPBOX_TOKEN</code> en
            <code className="bg-gray-800 px-1 rounded ml-1">.env.local</code> para activar el mapa.
          </p>
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Origen: {pickup.label || `${pickup.lat.toFixed(4)}, ${pickup.lon.toFixed(4)}`}</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" />Destino: {dropoff.label || `${dropoff.lat.toFixed(4)}, ${dropoff.lon.toFixed(4)}`}</div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center">
        <p className="text-sm text-gray-400">Mapa no disponible</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden mb-4" style={{ height: 280 }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />

      {!ready && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-center text-gray-400">
            <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-[#ff4c41] rounded-full animate-spin mb-2" />
            <p className="text-xs">Cargando mapa…</p>
          </div>
        </div>
      )}

      {(distance !== undefined || duration !== undefined) && (
        <div className="absolute bottom-3 left-3 bg-white rounded-xl px-3 py-2 shadow-md z-10 flex gap-3 text-xs font-semibold text-gray-700">
          {distance !== undefined && <span>📍 {distance.toFixed(1)} km</span>}
          {duration !== undefined && <span>⏱️ ~{duration} min</span>}
        </div>
      )}
    </div>
  );
}

/* ── Backward-compatible export ── */
export function TrackingMap() {
  const { activeRide } = useRideStore();
  if (!activeRide) return null;
  return (
    <MapboxMap
      pickup={activeRide.pickup}
      dropoff={activeRide.dropoff}
      driverLocation={activeRide.driverLocation}
      distance={activeRide.distance}
      duration={activeRide.duration}
    />
  );
}
