import { httpClient } from './http.client';
import { trackingWsManager, LocationUpdate, DriverUpdate } from './tracking-websocket';

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
  accuracy?: number;
}

export class TrackingClient {
  async getActiveDrivers(): Promise<Driver[]> {
    return httpClient.get<Driver[]>('/tracking/active-drivers');
  }

  async broadcastLocation(data: UpdateLocationRequest): Promise<{ message: string }> {
    // If WebSocket is connected, use it for real-time updates
    if (trackingWsManager.isConnected()) {
      trackingWsManager.sendLocationUpdate({
        driverId: data.driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy || 0,
        timestamp: Date.now(),
      });
      return { message: 'Location update sent via WebSocket' };
    }

    // Fallback to HTTP
    return httpClient.post<{ message: string }>('/tracking/location', data);
  }

  /**
   * Connect to WebSocket for real-time tracking
   */
  async connectWebSocket(): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    await trackingWsManager.connect(token || undefined);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnectWebSocket(): void {
    trackingWsManager.disconnect();
  }

  /**
   * Subscribe to location updates
   */
  onLocationUpdate(handler: (location: LocationUpdate) => void): () => void {
    return trackingWsManager.onLocationUpdate(handler);
  }

  /**
   * Subscribe to driver status changes
   */
  onDriverStatusChange(handler: (update: DriverUpdate) => void): () => void {
    return trackingWsManager.onDriverStatusChange(handler);
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return trackingWsManager.isConnected();
  }
}

export const trackingClient = new TrackingClient();
