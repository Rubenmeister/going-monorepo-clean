import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  Type,
  IsObject,
  IsBoolean,
} from 'class-validator';

/**
 * Send Notification DTO
 * POST /api/notifications/send
 */
export class SendNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(['RIDE_MATCH', 'MESSAGE', 'STATUS', 'RATE_REMINDER', 'ALERT'])
  type: string;

  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(['PUSH', 'SMS', 'EMAIL', 'IN_APP'], { each: true })
  channels?: string[];

  @IsOptional()
  @IsObject()
  data?: {
    rideId?: string;
    driverId?: string;
    actionUrl?: string;
  };

  @IsOptional()
  @Type(() => Number)
  delayMs?: number;
}

/**
 * Send Notification Response DTO
 */
export class SendNotificationResponseDto {
  notificationId: string;
  userId: string;
  type: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'QUEUED';
  sentAt?: Date;
  createdAt: Date;
}

/**
 * Notification DTO (for list responses)
 */
export class NotificationDto {
  notificationId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  imageUrl?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  readAt?: Date;
  createdAt: Date;
  actionUrl?: string;
}

/**
 * Get User Notifications Query DTO
 * GET /api/notifications/user?page=1&limit=20&filter=unread
 */
export class GetUserNotificationsQueryDto {
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsEnum(['all', 'unread'])
  filter?: string;

  @IsOptional()
  @IsEnum(['RIDE_MATCH', 'MESSAGE', 'STATUS', 'RATE_REMINDER', 'ALERT'])
  type?: string;
}

/**
 * Get User Notifications Response DTO
 */
export class GetUserNotificationsResponseDto {
  notifications: NotificationDto[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Mark Notification as Read DTO
 * PUT /api/notifications/:notificationId/read
 */
export class MarkNotificationReadDto {
  // Empty body - just mark as read
}

/**
 * Get Notification Status DTO
 * GET /api/notifications/:notificationId/status
 */
export class NotificationStatusDto {
  notificationId: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'READ';
  createdAt: Date;
  sentAt?: Date;
  readAt?: Date;
  failureReason?: string;
  retries: number;
}

/**
 * Get Unread Count Response DTO
 * GET /api/notifications/unread-count
 */
export class UnreadCountResponseDto {
  userId: string;
  unreadCount: number;
  byType: {
    [key: string]: number;
  };
}

/**
 * Device Token Registration DTO
 * POST /api/device-tokens/register
 */
export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsEnum(['ios', 'android', 'web'])
  platform: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Device Token Response DTO
 */
export class DeviceTokenResponseDto {
  tokenId: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  isActive: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

/**
 * Get User Device Tokens Response DTO
 * GET /api/device-tokens/user
 */
export class GetUserDeviceTokensResponseDto {
  tokens: DeviceTokenResponseDto[];
  total: number;
}

/**
 * Delete Device Token Response DTO
 * DELETE /api/device-tokens/:tokenId
 */
export class DeleteDeviceTokenResponseDto {
  success: boolean;
  message: string;
}

/**
 * Notification Preferences DTO
 * PUT /api/notifications/preferences
 */
export class NotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(['RIDE_MATCH', 'MESSAGE', 'STATUS', 'RATE_REMINDER', 'ALERT'], {
    each: true,
  })
  disabledTypes?: string[];

  @IsOptional()
  @IsBoolean()
  quietHours?: boolean;

  @IsOptional()
  @IsString()
  quietHoursStart?: string; // HH:mm format

  @IsOptional()
  @IsString()
  quietHoursEnd?: string; // HH:mm format
}

/**
 * Get Notification Preferences Response DTO
 */
export class GetNotificationPreferencesResponseDto {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  disabledTypes: string[];
  quietHours: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  lastUpdatedAt: Date;
}
