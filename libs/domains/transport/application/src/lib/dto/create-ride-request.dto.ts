import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleTypeEnum } from '@going-monorepo-clean/domains-transport-core';
import { LocationDto, MoneyDto } from '@going-monorepo-clean/shared-domain';

export class CreateRideRequestDto {
  @IsNotEmpty()
  @IsUUID()
  passengerId: string;

  @ValidateNested()
  @Type(() => LocationDto)
  origin: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  destination: LocationDto;

  @IsEnum(VehicleTypeEnum)
  vehicleType: VehicleTypeEnum;

  @IsEnum(['PRIVATE', 'SHARED'] as const)
  rideType: 'PRIVATE' | 'SHARED';

  @IsEnum(['FRONT', 'BACK'] as const)
  seatPreference: 'FRONT' | 'BACK';

  @IsInt()
  @Min(1)
  passengersCount: number;

  @ValidateNested()
  @Type(() => MoneyDto)
  basePrice: MoneyDto;
}
