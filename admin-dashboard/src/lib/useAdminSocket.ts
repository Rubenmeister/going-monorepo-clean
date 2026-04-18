'use client';

/**
 * useAdminSocket
 * Conecta al Socket.io del API Gateway con el token JWT del admin.
 * Carga socket.io-client desde CDN (no requiere npm install).
 *
 * Eventos que el admin recibe:
 *   - driverLocationUpdated  → GPS en tiempo real de todos los conductores
 *   - ride:driver_accepted   → Un conductor aceptó un viaje
 *   - ride:started           → Viaje comenzó
 *   - ride:completed         → Viaje finalizado
 *   - ride:driver_location   → Ubicación parcial de un viaje
 *   - connect / disconnect   → Estado de conexión
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────── */
export interface DriverLocation {
  driverId: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  status?: string;
  updatedAt?: string;
}

export interface LiveEvent {
  id: string;
  type:
    | 'ride_accepted'
    | 'ride_started'
    | 'ride_completed'
    | 'ride_cancelled'
    | 'driver_online'
    | 'driver_offline'
    | 'location_update';
  rideId?: string;
  driverId?: string;
  message: string;
  timestamp: Date;
}

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface AdminSocketHandlers {
  onDriverLocation?: (loc: DriverLocation) => void;
  onLiveEvent?: (evt: LiveEvent) => void;
}

/* ─── CDN loader ─────────────────────────────────────────────────────── */
let ioLib: any = null;

async function loadSocketIO(): Promise<any> {
  if (ioLib) return ioLib;
  if (typeof window === 'undefined') return null;
  if ((window as any).io) { ioLib = (window as any).io; return ioLib; }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    s.onload  = () => { ioLib = (window as any).io; resolve(ioLib); };
    s.onerror = () => reject(new Error('socket.io CDN no disponible'));
    document.head.appendChild(s);
  });
}

/* ─── Hook ───────────────────────────────────────────────────────────── */
export function useAdminSocket(handlers: AdminSocketHandlers = {}) {
  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const socketRef = useRef<any>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const connect = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL
      || process.env.NEXT_PUBLIC_API_URL
      || 'https://api-gateway-780842550857.us-central1.run.app';

    try {
      setStatus('connecting');
      const io = await loadSocketIO();
      if (!io) { setStatus('error'); return; }

      // Disconnect stale socket
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket = io(WS_URL, {
        transports: ['websocket', 'polling'],
        auth: { token },
        query: { token },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 10,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setStatus('connected');
        /* Intentar unirse a sala admin si el backend la soporta */
        socket.emit('join:admin', { token });
      });

      socket.on('disconnect', () => setStatus('disconnected'));
      socket.on('connect_error', () => setStatus('error'));

      /* ── Driver GPS en tiempo real ── */
      socket.on('driverLocationUpdated', (data: DriverLocation) => {
        handlersRef.current.onDriverLocation?.(data);
      });

      /* Alias que usa el tracking-service namespace tracking */
      socket.on('driver:location:updated', (data: DriverLocation) => {
        handlersRef.current.onDriverLocation?.(data);
      });

      /* ── Eventos de vida del viaje ── */
      socket.on('ride:driver_accepted', (data: any) => {
        const evt: LiveEvent = {
          id: `${Date.now()}-accepted`,
          type: 'ride_accepted',
          rideId: data?.rideId,
          driverId: data?.driver?.id,
          message: `Conductor ${data?.driver?.name ?? 'asignado'} aceptó el viaje ${(data?.rideId ?? '').slice(0, 8)}`,
          timestamp: new Date(),
        };
        handlersRef.current.onLiveEvent?.(evt);
      });

      socket.on('ride:started', (data: any) => {
        const evt: LiveEvent = {
          id: `${Date.now()}-started`,
          type: 'ride_started',
          rideId: data?.rideId,
          message: `Viaje ${(data?.rideId ?? '').slice(0, 8)} iniciado`,
          timestamp: new Date(),
        };
        handlersRef.current.onLiveEvent?.(evt);
      });

      socket.on('ride:completed', (data: any) => {
        const evt: LiveEvent = {
          id: `${Date.now()}-completed`,
          type: 'ride_completed',
          rideId: data?.rideId,
          message: `Viaje ${(data?.rideId ?? '').slice(0, 8)} completado — ${data?.distanceKm?.toFixed(1) ?? '?'} km`,
          timestamp: new Date(),
        };
        handlersRef.current.onLiveEvent?.(evt);
      });

      socket.on('ride:cancelled', (data: any) => {
        const evt: LiveEvent = {
          id: `${Date.now()}-cancelled`,
          type: 'ride_cancelled',
          rideId: data?.rideId,
          message: `Viaje ${(data?.rideId ?? '').slice(0, 8)} cancelado`,
          timestamp: new Date(),
        };
        handlersRef.current.onLiveEvent?.(evt);
      });

    } catch {
      setStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, [connect, disconnect]);

  return { status, connect, disconnect };
}
