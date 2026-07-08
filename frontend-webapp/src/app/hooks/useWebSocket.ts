'use client'

import { useEffect } from 'react'
import wsService from '../services/websocketService'

// Refcount a nivel de módulo: el socket es un singleton compartido por varios
// consumidores (banner, panel de tracking, etc.). Antes cada uso desconectaba al
// desmontar → el primero en desmontar mataba el socket de los demás y StrictMode
// (mount→unmount→mount) lo cortaba (auditoría #44). Ahora se conecta con el primer
// consumidor y se desconecta solo cuando se va el último.
let refCount = 0

export function useWebSocket(token?: string) {
  useEffect(() => {
    refCount++
    if (refCount === 1) {
      wsService.connect(token).catch((err) => {
        console.warn('[useWebSocket] Failed to connect:', err)
      })
    }

    return () => {
      refCount--
      if (refCount <= 0) {
        refCount = 0
        wsService.disconnect()
      }
    }
  }, [token])

  return wsService
}

export function useRideSocket(rideId: string, handlers: Record<string, (data: unknown) => void>) {
  const ws = useWebSocket()

  useEffect(() => {
    if (!rideId) return

    // Sin join:ride el server no entrega eventos del room ride:${rideId}.
    ws.joinRide(rideId)

    const unsubscribers = Object.entries(handlers).map(([event, handler]) =>
      ws.on(event, handler)
    )

    return () => {
      ws.leaveRide(rideId)
      unsubscribers.forEach((unsub) => unsub())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId])

  return ws
}
