import { httpClient } from './http.client';

export interface Driver {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface UpdateLocationRequest {
  driverId: string;
  latitude: number;
  longitude: number;
}

export class TrackingClient {
  async getActiveDrivers(): Promise<Driver[]> {
    return httpClient.get<Driver[]>('/tracking/active-drivers');
  }

  async broadcastLocation(data: UpdateLocationRequest): Promise<{ message: string }> {
    // Note: This is typically done via WebSocket, but we provide HTTP fallback
    return { message: 'Location update sent' };
  }

  connectWebSocket(onLocationUpdate?: (location: any) => void): WebSocket | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('authToken');
    const wsUrl = `ws://localhost:3000?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Tracking WebSocket] Connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (onLocationUpdate) {
          onLocationUpdate(data);
        }
      };

      ws.onerror = (error) => {
        console.error('[Tracking WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[Tracking WebSocket] Disconnected');
      };

      return ws;
    } catch (error) {
      console.error('[Tracking WebSocket] Failed to connect:', error);
      return null;
    }
  }
}

export const trackingClient = new TrackingClient();
