import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export enum SeatPosition {
  FRONT = 'FRONT',
  BACK = 'BACK',
}

export const FRONT_SEAT_PREMIUM_CENTS = 300; // $3.00 USD extra

export interface SeatProps {
  seatNumber: number;
  position: SeatPosition;
  passengerId?: UUID;
  occupied: boolean;
}

export class Seat {
  readonly seatNumber: number;
  readonly position: SeatPosition;
  readonly passengerId?: UUID;
  readonly occupied: boolean;

  private constructor(props: SeatProps) {
    this.seatNumber = props.seatNumber;
    this.position = props.position;
    this.passengerId = props.passengerId;
    this.occupied = props.occupied;
  }

  public static create(props: { seatNumber: number; position: SeatPosition }): Result<Seat, Error> {
    if (props.seatNumber < 1) {
      return err(new Error('Seat number must be >= 1'));
    }
    return ok(new Seat({ ...props, occupied: false }));
  }

  public isFrontSeat(): boolean {
    return this.position === SeatPosition.FRONT;
  }

  public getPremiumCents(): number {
    return this.isFrontSeat() ? FRONT_SEAT_PREMIUM_CENTS : 0;
  }

  public assign(passengerId: UUID): Result<Seat, Error> {
    if (this.occupied) {
      return err(new Error(`Seat ${this.seatNumber} is already occupied`));
    }
    return ok(new Seat({
      seatNumber: this.seatNumber,
      position: this.position,
      passengerId,
      occupied: true,
    }));
  }

  public release(): Seat {
    return new Seat({
      seatNumber: this.seatNumber,
      position: this.position,
      occupied: false,
    });
  }

  public toPrimitives(): SeatProps {
    return {
      seatNumber: this.seatNumber,
      position: this.position,
      passengerId: this.passengerId,
      occupied: this.occupied,
    };
  }

  public static fromPrimitives(props: SeatProps): Seat {
    return new Seat(props);
  }
}
