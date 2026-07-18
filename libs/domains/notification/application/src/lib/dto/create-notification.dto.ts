import {
  IsOptional,
  IsObject, IsNotEmpty, IsString, IsUUID, IsEnum } from 'class-validator';
import { NotificationChannelType } from '@going-monorepo-clean/domains-notification-core';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string; // El destinatario

  @IsNotEmpty()
  @IsEnum(NotificationChannelType)
  channel: NotificationChannelType;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  /**
   * Datos del canal/evento: `phone` (destino WhatsApp), `url` (acción), ids de
   * referencia. Sin esto, WhatsApp no sabe a quién escribir.
   */
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}