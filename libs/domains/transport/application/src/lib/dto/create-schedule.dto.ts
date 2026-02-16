import { IsArray, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { DayOfWeek, ServiceType } from '@going-monorepo-clean/domains-transport-core';

export class CreateScheduleDto {
  @IsUUID()
  routeId: string;

  @IsUUID()
  vehicleId: string;

  @IsUUID()
  driverId: string;

  @IsEnum(['PASSENGER', 'DELIVERY', 'MIXED'] as const)
  serviceType: ServiceType;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'departureTime must be in HH:mm format' })
  departureTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'arrivalTime must be in HH:mm format' })
  arrivalTime: string;

  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  days: DayOfWeek[];

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;
}
