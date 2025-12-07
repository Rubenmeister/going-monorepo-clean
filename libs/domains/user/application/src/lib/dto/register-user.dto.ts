import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { RoleType } from '@going-monorepo-clean/domains-user-core';

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
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  // Single Role, Optional (defaults to USER in Entity)
  @IsOptional()
  @IsEnum(RoleType)
  role?: RoleType;
}