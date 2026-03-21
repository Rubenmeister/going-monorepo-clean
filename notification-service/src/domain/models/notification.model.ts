/**
 * Notification Domain Models
 * Core types and interfaces for the push notification system
 */

// Notification Types
export enum NotificationType {
  INVOICE_ISSUED = 'INVOICE_ISSUED',
  INVOICE_PAYMENT_REMINDER = 'INVOICE_PAYMENT_REMINDER',
  INVOICE_OVERDUE = 'INVOICE_OVERDUE',
  INVOICE_PAID = 'INVOICE_PAID',
  LOCATION_ALERT = 'LOCATION_ALERT',
  GEOFENCE_ENTRY = 'GEOFENCE_ENTRY',
  GEOFENCE_EXIT = 'GEOFENCE_EXIT',
  DRIVER_ASSIGNMENT = 'DRIVER_ASSIGNMENT',
  TRIP_STARTED = 'TRIP_STARTED',
  TRIP_COMPLETED = 'TRIP_COMPLETED',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
  DELIVERY_UPDATE = 'DELIVERY_UPDATE',
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
}

// Notification Channels
export enum NotificationChannel {
  PUSH = 'PUSH', // Firebase Cloud Messaging
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP', // WebSocket delivery
}

// Notification Status
export enum NotificationStatus {
  PENDING = 'PENDING', // Queued for delivery
  SENT = 'SENT', // Delivered to user device
  DELIVERED = 'DELIVERED', // Confirmed delivered
  READ = 'READ', // User read the notification
  FAILED = 'FAILED', // Delivery failed
  CANCELLED = 'CANCELLED', // Cancelled before sending
}

// Notification Priority
export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Base Notification Interface
export interface Notification {
  id?: string;
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  description?: string;
  icon?: string;
  image?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: NotificationStatus;
  relatedEntity?: {
    type: string; // e.g., 'invoice', 'trip', 'driver'
    id: string;
  };
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  failureReason?: string;
  deliveryAttempts?: number;
  maxDeliveryAttempts?: number;
  expiresAt?: Date;
}

// Device Token Interface
export interface DeviceToken {
  id?: string;
  userId: string;
  companyId: string;
  fcmToken: string; // Firebase Cloud Messaging token
  deviceType: 'iOS' | 'Android' | 'Web';
  deviceName?: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

// User Notification Preferences
export interface NotificationPreferences {
  id?: string;
  userId: string;
  companyId: string;
  enablePush: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  enableInApp: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
  quietHoursEnabled: boolean;
  doNotDisturb: boolean;
  unsubscribedTypes: NotificationType[];
  unsubscribedChannels: NotificationChannel[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification Template for multi-language support
export interface NotificationTemplate {
  id?: string;
  type: NotificationType;
  language: 'es' | 'en';
  title: string;
  messageTemplate: string; // Template with {{placeholders}}
  description?: string;
  icon?: string;
  priority: NotificationPriority;
  channels: NotificationChannel[];
  actionLabel?: string;
  createdAt: Date;
  updatedAt: Date;
}

// FCM Message Interface for Firebase integration
export interface FcmMessage {
  token: string;
  notification: {
    title: string;
    body: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  android?: {
    priority?: 'high' | 'normal';
    ttl?: number; // Time to live in seconds
    notification?: {
      clickAction?: string;
      sound?: string;
      color?: string;
      icon?: string;
    };
  };
  apns?: {
    payload?: {
      aps?: {
        alert?: {
          title: string;
          body: string;
        };
        badge?: number;
        sound?: string;
        'mutable-content'?: boolean;
      };
    };
  };
  webpush?: {
    headers?: Record<string, string>;
    data?: Record<string, string>;
    notification?: {
      title: string;
      body: string;
      icon?: string;
      image?: string;
      badge?: string;
      tag?: string;
      color?: string;
      requireInteraction?: boolean;
    };
    fcmOptions?: {
      link?: string;
    };
  };
}

// Notification Queue Job Interface
export interface NotificationQueueJob {
  notificationId: string;
  userId: string;
  companyId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: number;
  metadata?: Record<string, any>;
}

// Notification Event for WebSocket broadcasting
export interface NotificationEvent {
  notification: Notification;
  timestamp: Date;
  deviceId?: string; // Optional: specific device
  room?: string; // WebSocket room to broadcast to
}

// Geofence Alert Notification
export interface GeofenceAlertNotification extends Notification {
  relatedEntity: {
    type: 'geofence';
    id: string;
  };
  data: {
    driverId: string;
    vehicleId: string;
    geofenceName: string;
    latitude: number;
    longitude: number;
    distanceFromBoundary: number;
    eventType: 'entry' | 'exit';
  };
}

// Invoice Notification
export interface InvoiceNotification extends Notification {
  relatedEntity: {
    type: 'invoice';
    id: string;
  };
  data: {
    invoiceNumber: string;
    clientName: string;
    amount: number;
    dueDate: string;
    status: string;
  };
}

// Batch Send Response
export interface BatchSendResponse {
  successCount: number;
  failureCount: number;
  partialFailures: Array<{
    token: string;
    reason: string;
  }>;
}

// Notification Statistics
export interface NotificationStats {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalFailed: number;
  sendRate: number; // percentage
  deliveryRate: number; // percentage
  readRate: number; // percentage
  averageDeliveryTime: number; // milliseconds
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  byStatus: Record<NotificationStatus, number>;
}
