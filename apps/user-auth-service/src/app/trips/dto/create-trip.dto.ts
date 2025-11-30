import { IsEnum, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, PassengerType, PackageSize, PackageDetails } from '../types';

class PackageDetailsDto implements PackageDetails {
  @IsEnum(PackageSize) size: PackageSize;
  @IsString() @IsNotEmpty() description: string;
  @IsString() @IsNotEmpty() receiverName: string;
  @IsString() @IsNotEmpty() receiverPhone: string;
  @IsOptional() @IsString() deliveryInstructions?: string;
  @IsNotEmpty() isFragile: boolean;
}

class ManifestItemDto {
  @IsNumber() seatNumber: number;
  @IsEnum(PassengerType) type: PassengerType;
  @IsOptional() @ValidateNested() @Type(() => PackageDetailsDto) packageDetails?: PackageDetailsDto;
  @IsNumber() @Min(0) price: number;
}

export class CreateTripDto {
  @IsEnum(ServiceType) serviceType: ServiceType;
  @IsNotEmpty() originCity: string;
  @IsNotEmpty() destinationCity: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ManifestItemDto) manifest: ManifestItemDto[];
}
