import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface DriverInfo {
  name: string;
  rating: number; // 0-5
  acceptanceRate: number; // 0-1
  vehicleType: string;
  vehicleNumber?: string;
  photoUrl?: string;
}

export interface RideMatchProps {
  id: UUID;
  rideId: UUID;
  driverId: UUID;
  distance: number; // kilometers
  eta: number; // minutes
  acceptanceStatus: MatchStatus;
  driverInfo: DriverInfo;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
}

export class RideMatch {
  readonly id: UUID;
  readonly rideId: UUID;
  readonly driverId: UUID;
  readonly distance: number;
  readonly eta: number;
  readonly acceptanceStatus: MatchStatus;
  readonly driverInfo: DriverInfo;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly acceptedAt?: Date;
  readonly rejectedAt?: Date;

  private constructor(props: RideMatchProps) {
    this.id = props.id;
    this.rideId = props.rideId;
    this.driverId = props.driverId;
    this.distance = props.distance;
    this.eta = props.eta;
    this.acceptanceStatus = props.acceptanceStatus;
    this.driverInfo = props.driverInfo;
    this.createdAt = props.createdAt;
    this.expiresAt = props.expiresAt;
    this.acceptedAt = props.acceptedAt;
    this.rejectedAt = props.rejectedAt;
  }

  public static create(props: {
    rideId: UUID;
    driverId: UUID;
    distance: number;
    eta: number;
    driverInfo: DriverInfo;
    ttlSeconds?: number;
  }): Result<RideMatch, Error> {
    // Validation
    if (!props.rideId) {
      return err(new Error('Ride ID is required'));
    }
    if (!props.driverId) {
      return err(new Error('Driver ID is required'));
    }
    if (props.distance < 0) {
      return err(new Error('Distance cannot be negative'));
    }
    if (props.eta < 0) {
      return err(new Error('ETA cannot be negative'));
    }
    if (props.driverInfo.rating < 0 || props.driverInfo.rating > 5) {
      return err(new Error('Driver rating must be between 0 and 5'));
    }
    if (
      props.driverInfo.acceptanceRate < 0 ||
      props.driverInfo.acceptanceRate > 1
    ) {
      return err(new Error('Acceptance rate must be between 0 and 1'));
    }

    const now = new Date();
    const ttl = props.ttlSeconds || 120; // Default 2 minutes
    const expiresAt = new Date(now.getTime() + ttl * 1000);

    const match = new RideMatch({
      id: uuidv4(),
      rideId: props.rideId,
      driverId: props.driverId,
      distance: props.distance,
      eta: props.eta,
      acceptanceStatus: 'PENDING',
      driverInfo: props.driverInfo,
      createdAt: now,
      expiresAt,
    });

    return ok(match);
  }

  public accept(): Result<void, Error> {
    if (this.acceptanceStatus !== 'PENDING') {
      return err(new Error('Only pending matches can be accepted'));
    }
    if (this.isExpired()) {
      return err(new Error('Match has expired'));
    }

    (this as any).acceptanceStatus = 'ACCEPTED';
    (this as any).acceptedAt = new Date();
    return ok(undefined);
  }

  public reject(): Result<void, Error> {
    if (this.acceptanceStatus !== 'PENDING') {
      return err(new Error('Only pending matches can be rejected'));
    }

    (this as any).acceptanceStatus = 'REJECTED';
    (this as any).rejectedAt = new Date();
    return ok(undefined);
  }

  public expire(): Result<void, Error> {
    if (this.acceptanceStatus !== 'PENDING') {
      return err(new Error('Only pending matches can expire'));
    }

    (this as any).acceptanceStatus = 'EXPIRED';
    return ok(undefined);
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public isPending(): boolean {
    return this.acceptanceStatus === 'PENDING' && !this.isExpired();
  }

  public isAccepted(): boolean {
    return this.acceptanceStatus === 'ACCEPTED';
  }

  public isRejected(): boolean {
    return this.acceptanceStatus === 'REJECTED';
  }

  public calculateETA(): number {
    // ETA is stored in minutes during creation
    // Can be recalculated based on current location if needed
    return this.eta;
  }

  public validateDistance(maxRadius: number): boolean {
    return this.distance <= maxRadius;
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      rideId: this.rideId,
      driverId: this.driverId,
      distance: this.distance,
      eta: this.eta,
      acceptanceStatus: this.acceptanceStatus,
      driverInfo: this.driverInfo,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      acceptedAt: this.acceptedAt,
      rejectedAt: this.rejectedAt,
    };
  }

  public static fromPrimitives(props: any): RideMatch {
    return new RideMatch({
      id: props.id,
      rideId: props.rideId,
      driverId: props.driverId,
      distance: props.distance,
      eta: props.eta,
      acceptanceStatus: props.acceptanceStatus,
      driverInfo: props.driverInfo,
      createdAt: new Date(props.createdAt),
      expiresAt: new Date(props.expiresAt),
      acceptedAt: props.acceptedAt ? new Date(props.acceptedAt) : undefined,
      rejectedAt: props.rejectedAt ? new Date(props.rejectedAt) : undefined,
    });
  }
}
