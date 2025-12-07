import { Result, ok, err } from 'neverthrow';
import { v4 as uuidv4 } from 'uuid';

export interface HostProps {
  id: string;
  userId: string;
  name: string;
  phone?: string | null;
  isVerified: boolean;
  createdAt: Date;
}

export class Host {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly phone: string | null;
  readonly isVerified: boolean;
  readonly createdAt: Date;

  private constructor(props: HostProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.name = props.name;
    this.phone = props.phone ?? null;
    this.isVerified = props.isVerified;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    userId: string;
    name: string;
    phone?: string;
  }): Result<Host, Error> {
    if (!props.userId) {
      return err(new Error('User ID is required'));
    }
    if (!props.name || props.name.length < 2) {
      return err(new Error('Name must be at least 2 characters'));
    }

    return ok(
      new Host({
        id: uuidv4(),
        userId: props.userId,
        name: props.name,
        phone: props.phone,
        isVerified: false,
        createdAt: new Date(),
      })
    );
  }

  public verify(): Host {
    return new Host({
      ...this.toPrimitives(),
      isVerified: true,
    });
  }

  public toPrimitives(): HostProps {
    return {
      id: this.id,
      userId: this.userId,
      name: this.name,
      phone: this.phone,
      isVerified: this.isVerified,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: HostProps): Host {
    return new Host({
      id: props.id,
      userId: props.userId,
      name: props.name,
      phone: props.phone,
      isVerified: props.isVerified,
      createdAt: new Date(props.createdAt),
    });
  }
}
