import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsString, IsUUID, Max, Min } from 'class-validator';
import { VehicleTypeEnum } from '@going-monorepo-clean/domains-transport-core';

export class RegisterVehicleDto {
  @IsNotEmpty()
  @IsUUID()
  driverId: string;

  @IsEnum(VehicleTypeEnum)
  vehicleType: VehicleTypeEnum;

  @IsString()
  @IsNotEmpty()
  plate: string;

  @IsString()
  @IsNotEmpty()
  brand: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsInt()
  @Min(2000)
  @Max(2030)
  year: number;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsInt()
  @Min(1)
  seatCount: number;

  @IsInt()
  @Min(0)
  frontSeatCount: number;

  @IsBoolean()
  hasDashcam: boolean;
}
