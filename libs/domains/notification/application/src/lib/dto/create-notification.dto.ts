import { IsNotEmpty, IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';
import { NotificationType, NotificationChannelType } from '@going-monorepo-clean/domains-notification-core';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsEnum(NotificationChannelType)
  channel?: NotificationChannelType;

  @IsOptional()
  type?: NotificationType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;
}