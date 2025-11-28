import { Result, ok, err } from 'neverthrow';
// Importamos el RoleType desde la entidad para mantener consistencia
import { RoleType } from '../entities/user.entity';

export class Role {
  private constructor(public readonly value: RoleType) {}

  public static create(value: string | RoleType): Result<Role, Error> {
    // Validación simple: verificamos si el valor está en el Enum
    if (!Object.values(RoleType).includes(value as RoleType)) {
      return err(new Error(`Invalid role: ${value}`));
    }
    return ok(new Role(value as RoleType));
  }

  // Método helper para recuperar desde primitivos (Base de datos)
  public static fromPrimitives(value: string): Role {
    return new Role(value as RoleType);
  }

  public toPrimitives(): string {
    return this.value;
  }
}