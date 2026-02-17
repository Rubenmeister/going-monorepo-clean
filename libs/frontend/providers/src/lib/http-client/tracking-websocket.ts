/**
 * WebSocket handler for real-time driver location tracking.
 * Handles automatic reconnection, message parsing, and event subscriptions.
 */

export type TrackingEventHandler = (data: any) => void;

export interface LocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface DriverUpdate {
  driverId: string;
  status: 'available' | 'busy' | 'offline';
  location: LocationUpdate;
}

export class TrackingWebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Map<string, Set<TrackingEventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor(wsUrl: string = 'ws://localhost:3000') {
    this.url = wsUrl;
  }

  /**
   * Connect to WebSocket server
   */
  public connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const fullUrl = token ? `${this.url}?token=${token}` : this.url;
        this.ws = new WebSocket(fullUrl);

        this.ws.onopen = () => {
          console.log('[TrackingWS] Connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('[TrackingWS] Error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[TrackingWS] Disconnected');
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('[TrackingWS] Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send location update
   */
  public sendLocationUpdate(update: LocationUpdate): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[TrackingWS] WebSocket not connected');
      return;
    }

    this.ws.send(
      JSON.stringify({
        type: 'location_update',
        payload: update,
      })
    );
  }

  /**
   * Subscribe to location updates
   */
  public onLocationUpdate(handler: TrackingEventHandler): () => void {
    return this.subscribe('location_update', handler);
  }

  /**
   * Subscribe to driver status changes
   */
  public onDriverStatusChange(handler: TrackingEventHandler): () => void {
    return this.subscribe('driver_status', handler);
  }

  /**
   * Subscribe to generic events
   */
  public subscribe(eventType: string, handler: TrackingEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Private: Handle incoming WebSocket message
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const { type, payload } = message;

      if (this.handlers.has(type)) {
        this.handlers.get(type)!.forEach((handler) => {
          handler(payload);
        });
      }
    } catch (error) {
      console.error('[TrackingWS] Failed to parse message:', error);
    }
  }

  /**
   * Private: Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(
        '[TrackingWS] Max reconnection attempts reached. Giving up.'
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[TrackingWS] Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('authToken')
        : null;
      this.connect(token || undefined).catch(() => {
        // Failed, will retry on next disconnect
      });
    }, delay);
  }
}

// Export singleton instance
export const trackingWsManager = new TrackingWebSocketManager();
