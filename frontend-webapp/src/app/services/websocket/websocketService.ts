/**
 * WebSocket Service for real-time communication
 *
 * Usa socket.io-client para ser compatible con el backend
 * (transport-service usa @nestjs/platform-socket.io). Conecta al
 * namespace /rides donde el RideEventsGateway maneja todos los eventos.
 *
 * Requiere variable NEXT_PUBLIC_WS_URL en Vercel apuntando a la URL HTTPS
 * del transport-service (socket.io maneja el upgrade HTTP->WebSocket).
 */

import { io, Socket } from 'socket.io-client';
import { useRideStore } from '@/stores/rideStore';
import { useNotificationStore } from '@/stores/notificationStore';

type MessageHandler = (data: unknown) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private url: string;
  private isConnecting = false;
  private builtInBound = false;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to socket.io server (namespace /rides)
   */
  connect(token?: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.socket = io(`${this.url}/rides`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
          auth: token ? { token } : undefined,
          query: token ? { token } : undefined,
        });

        this.socket.on('connect', () => {
          this.isConnecting = false;
          console.log('[WS] Connected (socket.io)', this.socket?.id);
          if (!this.builtInBound) {
            this.bindBuiltInHandlers();
            this.builtInBound = true;
          }
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          this.isConnecting = false;
          console.error('[WS] connect_error:', error.message);
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[WS] Disconnected:', reason);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('[WS] Max reconnect attempts reached');
          useNotificationStore.getState().addNotification({
            type: 'error',
            title: 'Connection Lost',
            message: 'Real-time connection lost. Please refresh the page.',
          });
        });
      } catch (e) {
        this.isConnecting = false;
        reject(e);
      }
    });
  }

  /**
   * Suscribe handlers built-in para eventos comunes del backend.
   * Se ejecuta una sola vez al primer connect.
   */
  private bindBuiltInHandlers(): void {
    if (!this.socket) return;
    const s = this.socket;

    s.on('ride:status_update', (payload: unknown) => {
      const data = payload as { tripId: string; status: string };
      useRideStore
        .getState()
        .updateRideStatus(data.tripId, data.status as never);
    });

    s.on('ride:driver_location', (payload: unknown) => {
      const data = payload as { lat: number; lng: number; address?: string };
      useRideStore.getState().updateDriverLocation({
        lat: data.lat,
        lon: data.lng,
        address: data.address || '',
      });
    });

    s.on('ride:driver_assigned', () => {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Driver Found',
        message: 'A driver has been assigned to your ride',
      });
    });

    s.on('ride:completed', () => {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Ride Completed',
        message: 'Your ride has been completed. Please rate your driver.',
      });
    });

    s.on('ride:cancelled', () => {
      useNotificationStore.getState().addNotification({
        type: 'warning',
        title: 'Ride Cancelled',
        message: 'Your ride has been cancelled.',
      });
    });

    s.on('payment:processed', () => {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Payment Successful',
        message: 'Your payment has been processed.',
      });
    });
  }

  /**
   * Register event handler. Returns cleanup function.
   */
  on(eventType: string, handler: MessageHandler): () => void {
    if (this.socket) {
      this.socket.on(eventType, handler as (...args: unknown[]) => void);
      return () => {
        this.socket?.off(eventType, handler as (...args: unknown[]) => void);
      };
    }
    // Lazy bind si el socket aún no existe
    const tryBind = () => {
      if (this.socket) {
        this.socket.on(eventType, handler as (...args: unknown[]) => void);
      } else {
        setTimeout(tryBind, 100);
      }
    };
    tryBind();
    return () => {
      this.socket?.off(eventType, handler as (...args: unknown[]) => void);
    };
  }

  /**
   * Unregister event handler
   */
  off(eventType: string, handler: MessageHandler): void {
    this.socket?.off(eventType, handler as (...args: unknown[]) => void);
  }

  /**
   * Emit event to server
   */
  send(type: string, payload: unknown): boolean {
    if (!this.socket?.connected) {
      console.warn('[WS] Cannot send - not connected');
      return false;
    }
    this.socket.emit(type, payload);
    return true;
  }

  /**
   * Disconnect from socket.io server
   */
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.builtInBound = false;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// NEXT_PUBLIC_WS_URL debe ser HTTPS — socket.io hace el upgrade.
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  'https://transport-service-780842550857.us-central1.run.app';

export const wsService = new WebSocketService(WS_URL);
export default wsService;
