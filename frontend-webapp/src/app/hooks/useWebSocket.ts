'use client'

import { useEffect, useRef } from 'react'
import wsService from '../services/websocketService'

export function useWebSocket(token?: string) {
  const connected = useRef(false)

  useEffect(() => {
    if (connected.current) return
    connected.current = true

    wsService.connect(token).catch((err) => {
      console.warn('[useWebSocket] Failed to connect:', err)
    })

    return () => {
      wsService.disconnect()
      connected.current = false
    }
  }, [token])

  return wsService
}

export function useRideSocket(rideId: string, handlers: Record<string, (data: unknown) => void>) {
  const ws = useWebSocket()

  useEffect(() => {
    if (!rideId) return

    const unsubscribers = Object.entries(handlers).map(([event, handler]) =>
      ws.on(event, handler)
    )

    return () => {
      unsubscribers.forEach((unsub) => unsub())
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId])

  return ws
}
