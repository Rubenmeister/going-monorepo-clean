/**
 * Realtime Channel Types for WebSocket Communication
 * 
 * Channels follow format: {resource}:{id}
 * Examples: fleet:bogota, tour:123, shipment:456, company:tenant1
 */

// Channel types
export type ChannelType = 
  | 'fleet'       // Fleet tracking by city
  | 'tour'        // Tour tracking by tour ID
  | 'trip'        // Trip tracking by trip ID
  | 'shipment'    // Shipment/parcel tracking
  | 'company'     // Company/tenant channel
  | 'driver'      // Driver-specific updates
  | 'user';       // User-specific notifications

// Channel format
export interface Channel {
  type: ChannelType;
  id: string;
}

// Parse channel string to Channel object
export function parseChannel(channelString: string): Channel | null {
  const parts = channelString.split(':');
  if (parts.length !== 2) return null;
  
  const [type, id] = parts;
  if (!isValidChannelType(type)) return null;
  
  return { type: type as ChannelType, id };
}

// Create channel string from Channel object
export function createChannel(type: ChannelType, id: string): string {
  return `${type}:${id}`;
}

// Validate channel type
export function isValidChannelType(type: string): type is ChannelType {
  return ['fleet', 'tour', 'trip', 'shipment', 'company', 'driver', 'user'].includes(type);
}

// Event types for realtime updates
export type RealtimeEventType =
  | 'location_update'
  | 'status_change'
  | 'eta_update'
  | 'notification'
  | 'chat_message'
  | 'assignment';

// Base realtime event
export interface RealtimeEvent<T = unknown> {
  channel: string;
  type: RealtimeEventType;
  payload: T;
  timestamp: number;
}

// Specific event payloads
export interface LocationUpdatePayload {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export interface StatusChangePayload {
  previousStatus: string;
  newStatus: string;
  changedBy?: string;
}

export interface ETAUpdatePayload {
  eta: string; // ISO date
  distanceRemaining?: number;
}

export interface NotificationPayload {
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high';
}

// Subscription request
export interface SubscriptionRequest {
  channel: string;
  userId: string;
  tenantId?: string;
}

// Subscription result
export interface SubscriptionResult {
  allowed: boolean;
  reason?: string;
}
