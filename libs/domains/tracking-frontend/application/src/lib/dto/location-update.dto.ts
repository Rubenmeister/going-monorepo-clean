import { IsNotEmpty, IsUUID, IsLatitude, IsLongitude } from 'class-validator';

export class LocationUpdateDto {
  @IsNotEmpty()
  @IsUUID()
  driverId: string;

  @IsNotEmpty()
  @IsLatitude()
  latitude: number;

  @IsNotEmpty()
  @IsLongitude()
  longitude: number;
}