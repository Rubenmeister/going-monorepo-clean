import { IsNotEmpty, IsString, IsEmail, MinLength, MaxLength, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@going-monorepo-clean/domains-user-core';

export class RegisterUserDto {
  @ApiProperty({ example: 'usuario@example.com', description: 'Email del usuario' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'MiP@ssw0rd!',
    description: 'Contraseña segura: mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial',
    minLength: 8,
    maxLength: 64,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(64, { message: 'Password must not exceed 64 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Password must contain at least one special character' })
  password: string;

  @ApiProperty({ example: 'María', description: 'Nombre del usuario' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Espinoza', description: 'Apellido del usuario' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+593999123456', description: 'Teléfono del usuario' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: ['user'], description: 'Roles del usuario', enum: RoleType, isArray: true })
  @IsNotEmpty()
  @IsEnum(RoleType, { each: true })
  roles: RoleType[];
}
