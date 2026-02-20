/**
 * Notification DTOs
 * Data transfer objects for notification API
 */

import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  Type,
} from 'class-validator';

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsEnum([
    'INVOICE_ISSUED',
    'INVOICE_PAYMENT_REMINDER',
    'INVOICE_OVERDUE',
    'INVOICE_PAID',
    'LOCATION_ALERT',
    'GEOFENCE_ENTRY',
    'GEOFENCE_EXIT',
    'DRIVER_ASSIGNMENT',
    'TRIP_STARTED',
    'TRIP_COMPLETED',
    'SYSTEM_ALERT',
    'DELIVERY_UPDATE',
    'PAYMENT_CONFIRMATION',
  ])
  type: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(['PUSH', 'EMAIL', 'SMS', 'IN_APP'], { each: true })
  channels?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => RelatedEntityDto)
  relatedEntity?: RelatedEntityDto;

  @IsOptional()
  @IsString()
  actionUrl?: string;

  @IsOptional()
  @IsString()
  actionLabel?: string;

  @IsOptional()
  data?: Record<string, any>;
}

class RelatedEntityDto {
  @IsString()
  type: string;

  @IsString()
  id: string;
}

export class RegisterDeviceTokenDto {
  @IsString()
  fcmToken: string;

  @IsEnum(['iOS', 'Android', 'Web'])
  deviceType: 'iOS' | 'Android' | 'Web';

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  enablePush?: boolean;

  @IsOptional()
  enableEmail?: boolean;

  @IsOptional()
  enableSms?: boolean;

  @IsOptional()
  enableInApp?: boolean;

  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @IsOptional()
  quietHoursEnabled?: boolean;

  @IsOptional()
  doNotDisturb?: boolean;

  @IsOptional()
  @IsArray()
  unsubscribedTypes?: string[];

  @IsOptional()
  @IsArray()
  unsubscribedChannels?: string[];
}
