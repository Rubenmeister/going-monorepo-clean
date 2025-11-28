import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
//✅ BIEN (Ajusta la ruta según donde tengas definido RoleType)
import { RoleType } from '../entities/user.entity'; 
// O si está en types: import { RoleType } from '../types/role.type';/ Reemplaza 'going-monorepo-clean' con el scope de tu monorepo

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