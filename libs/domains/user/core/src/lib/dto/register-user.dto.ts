import { IsNotEmpty, IsString, IsEmail, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '../value-objects/role.vo';

export class RegisterUserDto {
  @ApiProperty({ example: 'usuario@example.com', description: 'Email del usuario' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MiPassword123', description: 'Contraseña (mínimo 8 caracteres)', minLength: 8 })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+573001234567', description: 'Teléfono del usuario' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: ['user'], description: 'Roles del usuario', enum: RoleType, isArray: true })
  @IsNotEmpty()
  @IsEnum(RoleType, { each: true })
  roles: RoleType[];
}
