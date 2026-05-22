import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsOptional,
  IsIn,
  IsArray,
} from 'class-validator';
import { RoleType } from '../value-objects/role.vo';

export class RegisterUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(12, { message: 'La contraseña debe tener al menos 12 caracteres' })
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
