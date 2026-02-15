import { IsNotEmpty, IsString, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannelType } from '@going-monorepo-clean/domains-notification-core';

export class CreateNotificationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID del usuario destinatario' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'push', description: 'Canal de notificación', enum: NotificationChannelType })
  @IsNotEmpty()
  @IsEnum(NotificationChannelType)
  channel: NotificationChannelType;

  @ApiProperty({ example: 'Tu viaje ha sido confirmado', description: 'Título de la notificación' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Tu viaje a Cuenca sale mañana a las 8:00 AM', description: 'Cuerpo de la notificación' })
  @IsNotEmpty()
  @IsString()
  body: string;
}
