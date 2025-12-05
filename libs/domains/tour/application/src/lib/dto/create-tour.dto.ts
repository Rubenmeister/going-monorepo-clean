import { IsNotEmpty, IsString, IsNumber, Min, IsIn } from 'class-validator';

export class CreateTourDto {
  @IsNotEmpty()
  @IsString()
  hostId: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerPerson: number;

  @IsNotEmpty()
  @IsIn(['USD', 'EUR'])
  currency: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maxCapacity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  durationHours: number;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsString()
  meetingPoint: string;
}