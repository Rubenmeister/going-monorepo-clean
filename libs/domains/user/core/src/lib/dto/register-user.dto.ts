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

  /**
   * SEGURIDAD: el DTO solo valida que sean nombres de rol conocidos y NO
   * catastróficos. 'admin' y 'corporate' se quitan a propósito del @IsIn —
   * ningún cliente legítimo los envía al registro público, así que un body
   * con esos roles falla con 400 acá mismo (defensa en el borde).
   * El privilegio real lo decide el use-case (sanitizeSelfServiceRoles), que
   * además degrada 'operator' a 'user'. 'operator' se acepta acá solo para
   * no romper el alta del webapp (que lo manda); el use-case lo neutraliza.
   * `roles` es opcional: si falta, el use-case asigna 'user' por defecto.
   */
  @IsOptional()
  @IsArray()
  @IsIn(['user', 'driver', 'host', 'guide', 'operator'], { each: true })
  roles?: RoleType[];
}
