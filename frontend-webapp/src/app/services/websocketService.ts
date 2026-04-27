/**
 * WebSocket Service for real-time ride updates, driver location, and chat.
 *
 * Usa socket.io-client (no WebSocket nativo) porque el backend
 * (transport-service) usa @nestjs/platform-socket.io. Conecta al namespace
 * /rides donde el backend tiene el RideEventsGateway.
 *
 * IMPORTANTE: variable NEXT_PUBLIC_WS_URL debe estar configurada en Vercel
 * apuntando a la URL HTTPS del transport-service (socket.io maneja el upgrade
 * HTTP->WebSocket automáticamente). Ej:
 *   NEXT_PUBLIC_WS_URL=https://transport-service-780842550857.us-central1.run.app
 */

import { io, Socket } from 'socket.io-client'
import { useRideStore } from '../stores/rideStore'
import { useNotificationStore } from '../stores/notificationStore'

type MessageHandler = (data: unknown) => void

class WebSocketService {
  private socket: Socket | null = null
  private url: string
  private isConnecting = false
  private builtInBound = false

  constructor(url: string) {
    this.url = url
  }

  connect(token?: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return Promise.resolve()
    }

    this.isConnecting = true

    return new Promise((resolve, reject) => {
      try {
        // socket.io v4: namespace /rides + auth via auth payload (idiomático)
        // y query string como fallback (algunos backends lo leen de ahí).
        this.socket = io(`${this.url}/rides`, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 30000,
          auth: token ? { token } : undefined,
          query: token ? { token } : undefined,
        })

        this.socket.on('connect', () => {
          this.isConnecting = false
          console.log('[WS] Connected (socket.io)', this.socket?.id)
          if (!this.builtInBound) {
            this.bindBuiltInHandlers()
            this.builtInBound = true
          }
          resolve()
        })

        this.socket.on('connect_error', (error) => {
          this.isConnecting = false
          console.error('[WS] connect_error:', error.message)
          reject(error)
        })

        this.socket.on('disconnect', (reason) => {
          console.log('[WS] Disconnected:', reason)
        })

        this.socket.on('reconnect_failed', () => {
          console.error('[WS] Max reconnect attempts reached')
          useNotificationStore.getState().addNotification({
            type: 'error',
            title: 'Connection Lost',
            message: 'Real-time connection lost. Please refresh the page.',
          })
        })
      } catch (e) {
        this.isConnecting = false
        reject(e)
      }
    })
  }

  /**
   * Suscribe los handlers built-in a eventos específicos del backend.
   * Se llama una sola vez al primer connect — re-conexiones no duplican.
   */
  private bindBuiltInHandlers() {
    if (!this.socket) return
    const s = this.socket

    s.on('ride:status_update', (payload: unknown) => {
      const data = payload as { tripId: string; status: string }
      useRideStore.getState().updateRideStatus(data.tripId, data.status as never)
    })

    s.on('ride:driver_location', (payload: unknown) => {
      const data = payload as { lat: number; lng: number; address?: string }
      useRideStore.getState().updateDriverLocation({
        lat: data.lat,
        lon: data.lng,
        address: data.address || '',
      })
    })

    s.on('ride:driver_assigned', () => {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Driver Found',
        message: 'A driver has been assigned to your ride',
      })
    })

    s.on('ride:completed', () => {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Ride Completed',
        message: 'Your ride has been completed. Please rate your driver.',
      })
    })

    s.on('ride:cancelled', () => {
      useNotificationStore.getState().addNotification({
        type: 'warning',
        title: 'Viaje cancelado',
        message: 'Tu viaje ha sido cancelado.',
      })
    })

    s.on('ride:no_driver_found', (payload: unknown) => {
      const data = payload as { tripId?: string }
      if (data?.tripId) {
        useRideStore.getState().updateRideStatus(data.tripId, 'no_driver' as never)
      }
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Sin conductor disponible',
        message: 'No encontramos conductor en tu zona. Por favor intenta de nuevo.',
      })
    })

    s.on('payment:processed', () => {
      useNotificationStore.getState().addNotification({
        type: 'success',
        title: 'Payment Successful',
        message: 'Your payment has been processed.',
      })
    })
  }

  /**
   * Suscribe un handler a un evento específico. Devuelve función de cleanup.
   * Compatible con la API anterior basada en WebSocket nativo.
   */
  on(eventType: string, handler: MessageHandler): () => void {
    if (this.socket) {
      this.socket.on(eventType, handler as (...args: unknown[]) => void)
      return () => {
        this.socket?.off(eventType, handler as (...args: unknown[]) => void)
      }
    }
    // Si aún no hay socket, lo intentamos suscribir más tarde via lazy bind
    const tryBind = () => {
      if (this.socket) {
        this.socket.on(eventType, handler as (...args: unknown[]) => void)
      } else {
        setTimeout(tryBind, 100)
      }
    }
    tryBind()
    return () => {
      this.socket?.off(eventType, handler as (...args: unknown[]) => void)
    }
  }

  off(eventType: string, handler: MessageHandler): void {
    this.socket?.off(eventType, handler as (...args: unknown[]) => void)
  }

  /**
   * Emite un evento al server. Mantiene la firma anterior `send(type, payload)`.
   */
  send(type: string, payload: unknown): boolean {
    if (!this.socket?.connected) {
      console.warn('[WS] Cannot send - not connected')
      return false
    }
    this.socket.emit(type, payload)
    return true
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
    this.builtInBound = false
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

// IMPORTANTE: NEXT_PUBLIC_WS_URL debe ser HTTPS (no wss://). socket.io
// maneja el upgrade. En desarrollo: http://localhost:3001 (transport-service).
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  'https://transport-service-780842550857.us-central1.run.app'

export const wsService = new WebSocketService(WS_URL)
export default wsService
