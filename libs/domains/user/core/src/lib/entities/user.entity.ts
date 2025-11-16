import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain'; // Reemplaza 'going-monorepo-clean' con el scope de tu monorepo
import { Role, RoleType } from '../value-objects/role.vo';
import { IPasswordHasher } from '../ports/ipassword-hasher';

export type UserStatus = 'pending_verification' | 'active' | 'suspended';

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
      roles: this.roles.map(role => role.toPrimitives()),
      status: this.status,
      createdAt: this.createdAt,
      verificationToken: this.verificationToken,
    };
  }

  public static fromPrimitives(props: any): User {
    return new User({
      ...props,
      roles: props.roles.map((role: string) => Role.fromPrimitives(role)),
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