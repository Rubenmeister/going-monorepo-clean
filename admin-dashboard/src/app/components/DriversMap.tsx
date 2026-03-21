'use client';

import { useEffect, useRef } from 'react';

export interface ActiveDriver {
  driverId: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  status?: string;
}

interface DriversMapProps {
  drivers: ActiveDriver[];
}

export default function DriversMap({ drivers }: DriversMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    import('leaflet').then((L) => {
      // Fix default icon URLs (webpack asset bundling issue)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Create map if not already created (Bogotá as default centre)
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current!, {
          zoomControl: true,
        }).setView([4.711, -74.0721], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current);
      }

      // Remove stale markers
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      // Custom driver icon
      const driverIcon = L.divIcon({
        html: `<div style="
          background:#ff4c41;color:#fff;width:32px;height:32px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:16px;border:3px solid #fff;
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
        ">🚗</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      // Add a marker for every active driver
      drivers.forEach((driver) => {
        if (
          driver.latitude == null ||
          driver.longitude == null ||
          isNaN(driver.latitude) ||
          isNaN(driver.longitude)
        )
          return;

        const updatedAgo = Math.round(
          (Date.now() - new Date(driver.updatedAt).getTime()) / 1000
        );
        const updatedLabel =
          updatedAgo < 60
            ? `${updatedAgo}s ago`
            : `${Math.round(updatedAgo / 60)}m ago`;

        const marker = L.marker([driver.latitude, driver.longitude], {
          icon: driverIcon,
        })
          .addTo(mapInstanceRef.current)
          .bindPopup(
            `<div style="min-width:160px">
              <b style="color:#ff4c41">🚗 Conductor activo</b><br/>
              <span style="font-size:12px;color:#555">ID: ${driver.driverId.slice(
                0,
                12
              )}…</span><br/>
              <span style="font-size:12px">Estado: <b>${
                driver.status ?? 'disponible'
              }</b></span><br/>
              <span style="font-size:11px;color:#999">Actualizado: ${updatedLabel}</span>
            </div>`,
            { maxWidth: 200 }
          );
        markersRef.current.push(marker);
      });

      // Fit bounds if we have markers
      if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
      }
    });
  }, [drivers]);

  return (
    <>
      {/* Leaflet CSS loaded from CDN */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <div
        ref={mapRef}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      />
    </>
  );
}
