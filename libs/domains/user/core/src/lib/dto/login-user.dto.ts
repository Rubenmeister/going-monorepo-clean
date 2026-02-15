import { IsNotEmpty, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'usuario@example.com', description: 'Email del usuario' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MiPassword123', description: 'Contraseña del usuario' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
