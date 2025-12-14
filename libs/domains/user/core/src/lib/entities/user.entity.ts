import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';

// Aligned with Prisma Schema
export enum RoleType {
  ADMIN = 'ADMIN',
  USER = 'USER',
  HOST = 'HOST',
  DRIVER = 'DRIVER'
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: RoleType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly name: string;
  readonly role: RoleType;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: UserProps) {
    this.id = props.id;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.name = props.name;
    this.role = props.role;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public static create(props: {
    email: string;
    passwordHash: string;
    name: string;
    role?: RoleType;
  }): Result<User, Error> {
    if (props.name.length < 2) {
      return err(new Error('Name is too short'));
    }

    if (!props.email.includes('@')) {
      return err(new Error('Invalid email'));
    }

    return ok(new User({
      id: uuidv4(),
      email: props.email,
      passwordHash: props.passwordHash,
      name: props.name,
      role: props.role || RoleType.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  public toPrimitives(): UserProps {
    return {
      id: this.id,
      email: this.email,
      passwordHash: this.passwordHash,
      name: this.name,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  public static fromPrimitives(props: UserProps): User {
    return new User({
      ...props,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
    });
  }
}