import { Result, ok, err } from 'neverthrow';

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
  DRIVER = 'driver',
  HOST = 'host',
}

export class Role {
  readonly value: RoleType;

  private constructor(value: RoleType) {
    this.value = value;
  }

  public static create(value: string): Result<Role, Error> {
    const role = value.toLowerCase() as RoleType;
    if (!['admin', 'user', 'driver', 'host'].includes(role)) {
      return err(new Error('Invalid role'));
    }
    return ok(new Role(role));
  }

  public isAdmin(): boolean {
    return this.value === 'admin';
  }
  
  public isDriver(): boolean {
    return this.value === 'driver';
  }
  
  public toPrimitives(): string {
    return this.value;
  }
  
  public static fromPrimitives(value: string): Role {
    return new Role(value as RoleType);
  }
}