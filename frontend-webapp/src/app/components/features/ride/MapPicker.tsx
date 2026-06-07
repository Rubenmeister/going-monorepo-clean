'use client';

/**
 * MapPicker — mapa interactivo para fijar un punto exacto.
 *
 * Resuelve el caso de ciudades donde la búsqueda por texto trae pocas
 * direcciones: el usuario arrastra el pin (o toca el mapa) hasta el lugar
 * exacto y devolvemos las coordenadas. El padre se encarga de la
 * geocodificación inversa (coords → dirección legible).
 *
 * Usa Mapbox GL JS cargado por CDN (mismo loader que TrackingMap).
 */

import { useEffect, useRef, useState } from 'react';
import { loadMapbox } from '@/components/features/tracking/TrackingMap';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const DEFAULT_CENTER = { lat: -0.1807, lon: -78.4678 }; // Quito

interface Props {
  value?: { lat: number; lon: number };
  accent?: string;
  /** Se llama con las coordenadas cada vez que el pin se mueve (y al inicio). */
  onPick: (lat: number, lon: number) => void;
}

export function MapPicker({ value, accent = '#0033A0', onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!MAPBOX_TOKEN) { setErr(true); return; }
    loadMapbox().then(() => setReady(true)).catch(() => setErr(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mbgl: any = (window as any).mapboxgl;
    mbgl.accessToken = MAPBOX_TOKEN;

    const start = value && value.lat ? value : DEFAULT_CENTER;
    const map = new mbgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [start.lon, start.lat],
      zoom: 15,
    });

    const el = document.createElement('div');
    el.innerHTML = `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${accent};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.35);"></div>`;
    const marker = new mbgl.Marker({ element: el, draggable: true })
      .setLngLat([start.lon, start.lat])
      .addTo(map);

    const emit = () => { const { lng, lat } = marker.getLngLat(); onPick(lat, lng); };
    marker.on('dragend', emit);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.on('click', (e: any) => { marker.setLngLat(e.lngLat); emit(); });

    onPick(start.lat, start.lon); // emitir el punto inicial

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (err) {
    return (
      <div className="h-48 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-400 text-center px-4">
        Mapa no disponible (configura NEXT_PUBLIC_MAPBOX_TOKEN)
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ height: 220 }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      {!ready && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
          Cargando mapa…
        </div>
      )}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 rounded-full px-3 py-1 text-[11px] font-bold text-gray-700 shadow">
        Arrastra el pin o toca el mapa
      </div>
    </div>
  );
}
