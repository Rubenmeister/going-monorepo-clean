'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import dynamicImport from 'next/dynamic';

const TRANSPORT_WS =
  process.env.NEXT_PUBLIC_TRANSPORT_WS_URL ||
  'https://transport-service-780842550857.us-central1.run.app';

// Mapa cargado dinámicamente (no SSR)
const LiveMap = dynamicImport(() => import('./LiveMap'), { ssr: false });

interface DriverPos {
  lat: number;
  lng: number;
  heading?: number;
  eta?: number;
  etaText?: string;
}

interface RideInfo {
  origin:      string;
  destination: string;
  driverName:  string;
  vehicle:     string;
  plate:       string;
  status:      string;
}

export default function LiveTrackingPage() {
  const params           = useParams();
  const token            = params?.token as string;
  const socketRef        = useRef<any>(null);

  const [driverPos,  setDriverPos]  = useState<DriverPos | null>(null);
  const [rideInfo,   setRideInfo]   = useState<RideInfo | null>(null);
  const [status,     setStatus]     = useState<string>('Conectando...');
  const [completed,  setCompleted]  = useState(false);
  const [etaText,    setEtaText]    = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // Decodificar token para extraer rideId
    let rideId = '';
    try {
      const decoded = atob(token);
      rideId = decoded.split('-')[0];
    } catch {
      setStatus('Link inválido');
      return;
    }

    // Conectar al WebSocket del transport-service
    import('socket.io-client').then(({ io }) => {
      const socket = io(`${TRANSPORT_WS}/rides`, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setStatus('En vivo');
        socket.emit('join:tracking', { token });
      });

      socket.on('disconnect', () => setStatus('Sin conexión'));

      socket.on('ride:driver_location', (data: DriverPos & { rideId: string }) => {
        setDriverPos({ lat: data.lat, lng: data.lng, heading: data.heading, eta: data.eta, etaText: data.etaText });
      });

      socket.on('ride:eta_update', (data: { etaText: string }) => {
        setEtaText(data.etaText);
      });

      socket.on('ride:driver_arrived', () => {
        setStatus('Conductor llegó');
        setEtaText('El conductor ha llegado');
      });

      socket.on('ride:started', () => {
        setStatus('En camino');
        setEtaText(null);
      });

      socket.on('ride:completed', () => {
        setCompleted(true);
        setStatus('Viaje completado');
      });

      socket.on('ride:driver_accepted', (data: any) => {
        setRideInfo(prev => prev ? { ...prev, driverName: data.driver?.name, vehicle: data.driver?.vehicle, plate: data.driver?.plate, status: 'accepted' } : null);
        setEtaText(data.message);
      });
    });

    return () => socketRef.current?.disconnect();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/going-logo-h.png" alt="Going" className="h-7 w-auto" />
          <span className="text-sm text-gray-500">Seguimiento en vivo</span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          status === 'En vivo' || status === 'En camino'
            ? 'bg-green-100 text-green-700'
            : status === 'Viaje completado'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {status === 'En vivo' ? '● En vivo' : status}
        </span>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative min-h-[60vh]">
        {driverPos ? (
          <LiveMap driverPos={driverPos} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">🚗</div>
              <p className="text-sm">Esperando posición del conductor...</p>
            </div>
          </div>
        )}
      </div>

      {/* Panel inferior */}
      <div className="bg-white rounded-t-3xl shadow-lg px-6 py-5 space-y-3">
        {completed ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="font-bold text-gray-800">Viaje completado</p>
            <p className="text-sm text-gray-500 mt-1">El pasajero llegó a su destino</p>
          </div>
        ) : (
          <>
            {etaText && (
              <div className="flex items-center gap-3 p-3 bg-[#ff4c41]/10 rounded-xl">
                <span className="text-2xl">🕐</span>
                <p className="font-semibold text-[#ff4c41]">{etaText}</p>
              </div>
            )}

            {rideInfo && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#ff4c41] flex items-center justify-center text-white font-bold">
                  {rideInfo.driverName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{rideInfo.driverName}</p>
                  <p className="text-xs text-gray-500 truncate">{rideInfo.vehicle} · {rideInfo.plate}</p>
                </div>
              </div>
            )}

            <div className="text-center text-xs text-gray-400 pt-1">
              Este link te fue compartido por el pasajero del viaje Going
            </div>
          </>
        )}
      </div>
    </div>
  );
}
