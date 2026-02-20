/**
 * WebSocket Service for real-time communication
 * Handles connection, reconnection, and message routing
 */

import { useRideStore } from '@/stores/rideStore';
import { useNotificationStore } from '@/stores/notificationStore';

type MessageHandler = (data: unknown) => void;

interface WebSocketMessage {
  type: string;
  payload: unknown;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private url: string;
  private isConnecting = false;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token?: string): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;
    const wsUrl = token ? `${this.url}?token=${token}` : this.url;

    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          console.log('[WS] Connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (e) {
            console.error('[WS] Failed to parse message:', e);
          }
        };

        this.socket.onclose = () => {
          this.isConnecting = false;
          console.log('[WS] Disconnected');
          this.scheduleReconnect();
        };

        this.socket.onerror = (error) => {
          this.isConnecting = false;
          console.error('[WS] Error:', error);
          reject(error);
        };
      } catch (e) {
        this.isConnecting = false;
        reject(e);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const { type, payload } = message;

    // Built-in handlers for ride events
    switch (type) {
      case 'ride:status_update': {
        const data = payload as { tripId: string; status: string };
        useRideStore
          .getState()
          .updateRideStatus(data.tripId, data.status as never);
        break;
      }
      case 'ride:driver_location': {
        const data = payload as { lat: number; lng: number; address?: string };
        useRideStore.getState().updateDriverLocation({
          lat: data.lat,
          lon: data.lng,
          address: data.address || '',
        });
        break;
      }
      case 'ride:driver_assigned': {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Driver Found',
          message: 'A driver has been assigned to your ride',
        });
        break;
      }
      case 'ride:completed': {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Ride Completed',
          message: 'Your ride has been completed. Please rate your driver.',
        });
        break;
      }
      case 'ride:cancelled': {
        useNotificationStore.getState().addNotification({
          type: 'warning',
          title: 'Ride Cancelled',
          message: 'Your ride has been cancelled.',
        });
        break;
      }
      case 'payment:processed': {
        useNotificationStore.getState().addNotification({
          type: 'success',
          title: 'Payment Successful',
          message: 'Your payment has been processed.',
        });
        break;
      }
    }

    // Custom handlers
    const typeHandlers = this.handlers.get(type) || [];
    typeHandlers.forEach((handler) => handler(payload));

    const wildcardHandlers = this.handlers.get('*') || [];
    wildcardHandlers.forEach((handler) => handler(message));
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      useNotificationStore.getState().addNotification({
        type: 'error',
        title: 'Connection Lost',
        message: 'Real-time connection lost. Please refresh the page.',
      });
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `[WS] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }, this.reconnectDelay);
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: MessageHandler): () => void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
    return () => this.off(eventType, handler);
  }

  /**
   * Unregister event handler
   */
  off(eventType: string, handler: MessageHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    this.handlers.set(
      eventType,
      handlers.filter((h) => h !== handler)
    );
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, payload: unknown): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send - not connected');
      return false;
    }
    this.socket.send(JSON.stringify({ type, payload }));
    return true;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.maxReconnectAttempts = 0;
    this.socket?.close();
    this.socket = null;
  }

  /**
   * Check if connected
   */
  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
export const wsService = new WebSocketService(WS_URL);
export default wsService;
