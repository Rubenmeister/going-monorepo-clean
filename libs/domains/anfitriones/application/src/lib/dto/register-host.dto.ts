import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterHostDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
