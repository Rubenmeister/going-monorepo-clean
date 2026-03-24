'use client';

import { useEffect, useRef } from 'react';

interface DriverPos {
  lat: number;
  lng: number;
  heading?: number;
}

export default function LiveMap({ driverPos }: { driverPos: DriverPos }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapObj = useRef<any>(null);
  const marker = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      // Inicializar mapa una sola vez
      if (!mapObj.current) {
        mapObj.current = L.map(mapRef.current!).setView([driverPos.lat, driverPos.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(mapObj.current);
      }

      // Icono del coche
      const carIcon = L.divIcon({
        html: `<div style="font-size:28px;transform:rotate(${driverPos.heading ?? 0}deg)">🚗</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (marker.current) {
        marker.current.setLatLng([driverPos.lat, driverPos.lng]);
        marker.current.setIcon(carIcon);
      } else {
        marker.current = L.marker([driverPos.lat, driverPos.lng], { icon: carIcon })
          .addTo(mapObj.current);
      }

      mapObj.current.panTo([driverPos.lat, driverPos.lng]);
    });
  }, [driverPos]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} className="w-full h-full min-h-[60vh]" />
    </>
  );
}
