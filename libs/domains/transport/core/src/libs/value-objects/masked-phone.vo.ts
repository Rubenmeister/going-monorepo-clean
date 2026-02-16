import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface MaskedPhoneProps {
  id: UUID;
  realPhone: string;
  maskedNumber: string;
  assignedTo: UUID;
  assignedFor: UUID;
  tripId: UUID;
  expiresAt: Date;
  active: boolean;
}

export class MaskedPhone {
  readonly id: UUID;
  readonly realPhone: string;
  readonly maskedNumber: string;
  readonly assignedTo: UUID;
  readonly assignedFor: UUID;
  readonly tripId: UUID;
  readonly expiresAt: Date;
  readonly active: boolean;

  private constructor(props: MaskedPhoneProps) {
    this.id = props.id;
    this.realPhone = props.realPhone;
    this.maskedNumber = props.maskedNumber;
    this.assignedTo = props.assignedTo;
    this.assignedFor = props.assignedFor;
    this.tripId = props.tripId;
    this.expiresAt = props.expiresAt;
    this.active = props.active;
  }

  public static create(props: {
    realPhone: string;
    maskedNumber: string;
    assignedTo: UUID;
    assignedFor: UUID;
    tripId: UUID;
    durationMinutes: number;
  }): Result<MaskedPhone, Error> {
    if (!props.realPhone || props.realPhone.length < 7) {
      return err(new Error('Real phone number is required'));
    }
    if (!props.maskedNumber || props.maskedNumber.length < 7) {
      return err(new Error('Masked phone number is required'));
    }
    if (props.durationMinutes < 1) {
      return err(new Error('Duration must be at least 1 minute'));
    }

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + props.durationMinutes);

    return ok(new MaskedPhone({
      id: uuidv4(),
      realPhone: props.realPhone,
      maskedNumber: props.maskedNumber,
      assignedTo: props.assignedTo,
      assignedFor: props.assignedFor,
      tripId: props.tripId,
      expiresAt,
      active: true,
    }));
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public deactivate(): MaskedPhone {
    return new MaskedPhone({ ...this, active: false });
  }

  public toPrimitives(): MaskedPhoneProps {
    return { ...this };
  }

  public static fromPrimitives(props: MaskedPhoneProps): MaskedPhone {
    return new MaskedPhone(props);
  }
}
