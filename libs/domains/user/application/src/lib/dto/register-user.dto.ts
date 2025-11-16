import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { RoleType } from '@going-monorepo-clean/domains-user-core'; // Reemplaza con tu scope

export class RegisterUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNotEmpty()
  @IsEnum(RoleType, { each: true })
  roles: RoleType[];
}