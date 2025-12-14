import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// Host = Anfitrión (property owner who lists accommodations)
export interface HostProps {
  id: UUID;
  userId: UUID; // Link to user account
  name: string;
  email: string;
  phone?: string;
  isVerified: boolean;
  createdAt: Date;
}

export class Host {
  readonly id: UUID;
  readonly userId: UUID;
  readonly name: string;
  readonly email: string;
  readonly phone?: string;
  readonly isVerified: boolean;
  readonly createdAt: Date;

  private constructor(props: HostProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.email = props.email;
    this.phone = props.phone;
    this.isVerified = props.isVerified;
    this.createdAt = props.createdAt;
  }

  public static create(props: Omit<HostProps, 'id' | 'createdAt' | 'isVerified'>): Result<Host, Error> {
    if (!props.name || props.name.length < 2) {
      return err(new Error('Name must be at least 2 characters'));
    }
    
    return ok(new Host({
      ...props,
      id: crypto.randomUUID(),
      isVerified: false,
      createdAt: new Date(),
    }));
  }

  public verify(): Host {
    return new Host({ ...this.toPrimitives(), isVerified: true });
  }

  public toPrimitives(): HostProps {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      email: this.email,
      phone: this.phone,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: HostProps): Host {
    return new Host(props);
  }
}
