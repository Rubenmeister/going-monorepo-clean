import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsIn,
  IsArray,
} from 'class-validator';
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
  @IsArray()
  @IsIn(['admin', 'user', 'driver', 'host', 'guide', 'operator', 'corporate'], { each: true })
  roles: RoleType[];
}
