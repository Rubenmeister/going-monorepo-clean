import { IsNotEmpty, IsUUID, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendTemplateNotificationDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'PUSH', description: 'Channel: PUSH, EMAIL, SMS' })
  @IsNotEmpty()
  @IsString()
  channel: string;

  @ApiProperty({ example: 'trip_driver_assigned', description: 'Template name' })
  @IsNotEmpty()
  @IsString()
  templateName: string;

  @ApiProperty({ example: { driverName: 'Carlos', vehicleInfo: 'Toyota Corolla - ABC123', etaMinutes: '5' } })
  @IsNotEmpty()
  @IsObject()
  variables: Record<string, string>;

  @ApiPropertyOptional({ example: '+573001234567', description: 'Phone number for WhatsApp/SMS' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
