import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
// Si tienes problemas con esta librería, cambia UUID por string.
import { UUID } from '@going-monorepo-clean/shared-domain'; 
import { Role } from '../value-objects/role.vo';
import { IPasswordHasher } from '../ports/ipassword-hasher'; // Asegúrate que este nombre de archivo coincida

export type UserStatus = 'pending_verification' | 'active' | 'suspended';

// ✅ DEFINIMOS Y EXPORTAMOS EL ENUM AQUÍ PARA QUE LOS DTOs LO ENCUENTREN
export enum RoleType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  HOST = 'HOST'
}

export interface UserProps {
  id: UUID;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roles: Role[];
  status: UserStatus;
  createdAt: Date;
  verificationToken?: string;
}

export class User {
  readonly id: UUID;
  readonly email: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly roles: Role[];
  readonly status: UserStatus;
  readonly createdAt: Date;
  readonly verificationToken?: string;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.phone = props.phone;
    this.roles = props.roles;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.verificationToken = props.verificationToken;
  }

  public static create(props: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roles: Role[];
  }): Result<User, Error> {
    
    if (props.firstName.length < 2) {
      return err(new Error('First name is too short'));
    }

    const user = new User({
      id: uuidv4(),
      ...props,
      status: 'pending_verification',
      createdAt: new Date(),
      verificationToken: uuidv4(),
    });

    return ok(user);
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      // Asumimos que Role tiene un método toPrimitives o usamos .value
      roles: this.roles.map(role => role.value), 
      status: this.status,
      createdAt: this.createdAt,
      verificationToken: this.verificationToken,
    };
  }

  public static fromPrimitives(props: any): User {
    return new User({
      ...props,
      // Asumimos que Role.create devuelve un Result o una instancia
      roles: props.roles.map((role: string) => Role.create(role as RoleType)._unsafeUnwrap ? Role.create(role as RoleType)._unsafeUnwrap() : Role.create(role as RoleType)),
    });
  }

  public verifyAccount(): Result<void, Error> {
    if (this.status === 'active') {
      return err(new Error('Account is already active'));
    }
    (this as any).status = 'active';
    (this as any).verificationToken = undefined;
    return ok(undefined);
  }

  public checkPassword(password: string, hasher: IPasswordHasher): Promise<boolean> {
    return hasher.compare(password, this.passwordHash);
  }
  
  public hasRole(role: RoleType): boolean {
    return this.roles.some(r => r.value === role);
  }
}