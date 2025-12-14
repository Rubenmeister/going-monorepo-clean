import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { ServiceType } from '../value-objects/service-type.vo';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsOptional()
  metadata?: any;
}