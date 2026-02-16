import { IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class RegisterDriverProfileDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(7)
  whatsappNumber: string;
}
