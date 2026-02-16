import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Location } from '@going-monorepo-clean/shared-domain';
import { VehicleType } from '../value-objects/vehicle-type.vo';
import { Seat, SeatPosition } from '../value-objects/seat.vo';
import { DocumentUpload, DocumentType, DocumentStatus } from '../value-objects/document-upload.vo';

export type VehicleStatus = 'pending_approval' | 'active' | 'inactive' | 'suspended' | 'in_transit';

export const REQUIRED_DOCUMENTS: DocumentType[] = [
  DocumentType.VEHICLE_REGISTRATION,
  DocumentType.INSURANCE,
  DocumentType.VEHICLE_INSPECTION,
  DocumentType.VEHICLE_PHOTO_FRONT,
  DocumentType.VEHICLE_PHOTO_BACK,
  DocumentType.VEHICLE_PHOTO_INTERIOR,
  DocumentType.VEHICLE_PHOTO_DASHCAM,
];

export interface VehicleProps {
  id: UUID;
  driverId: UUID;
  type: VehicleType;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  seats: Seat[];
  documents: DocumentUpload[];
  hasDashcam: boolean;
  status: VehicleStatus;
  currentLocation?: Location;
  createdAt: Date;
}

export class Vehicle {
  readonly id: UUID;
  readonly driverId: UUID;
  readonly type: VehicleType;
  readonly plate: string;
  readonly brand: string;
  readonly model: string;
  readonly year: number;
  readonly color: string;
  readonly seats: Seat[];
  readonly documents: DocumentUpload[];
  readonly hasDashcam: boolean;
  readonly status: VehicleStatus;
  readonly currentLocation?: Location;
  readonly createdAt: Date;

  private constructor(props: VehicleProps) {
    this.id = props.id;
    this.driverId = props.driverId;
    this.type = props.type;
    this.plate = props.plate;
    this.brand = props.brand;
    this.model = props.model;
    this.year = props.year;
    this.color = props.color;
    this.seats = props.seats;
    this.documents = props.documents;
    this.hasDashcam = props.hasDashcam;
    this.status = props.status;
    this.currentLocation = props.currentLocation;
    this.createdAt = props.createdAt;
  }

  public static create(props: {
    driverId: UUID;
    type: VehicleType;
    plate: string;
    brand: string;
    model: string;
    year: number;
    color: string;
    seatCount: number;
    frontSeatCount: number;
    hasDashcam: boolean;
  }): Result<Vehicle, Error> {
    if (!props.plate || props.plate.length < 3) {
      return err(new Error('Plate number is required (min 3 chars)'));
    }
    if (!props.hasDashcam) {
      return err(new Error('Dashcam is mandatory for all vehicles'));
    }
    if (props.seatCount < 1) {
      return err(new Error('Vehicle must have at least 1 seat'));
    }
    if (props.frontSeatCount > props.seatCount) {
      return err(new Error('Front seat count cannot exceed total seats'));
    }
    if (props.seatCount > props.type.capacity.maxPassengers) {
      return err(new Error(`${props.type.value} max passengers: ${props.type.capacity.maxPassengers}`));
    }

    const seats: Seat[] = [];
    for (let i = 1; i <= props.seatCount; i++) {
      const position = i <= props.frontSeatCount ? SeatPosition.FRONT : SeatPosition.BACK;
      const seatResult = Seat.create({ seatNumber: i, position });
      if (seatResult.isErr()) return err(seatResult.error);
      seats.push(seatResult.value);
    }

    return ok(new Vehicle({
      id: uuidv4(),
      driverId: props.driverId,
      type: props.type,
      plate: props.plate.toUpperCase(),
      brand: props.brand,
      model: props.model,
      year: props.year,
      color: props.color,
      seats,
      documents: [],
      hasDashcam: props.hasDashcam,
      status: 'pending_approval',
      createdAt: new Date(),
    }));
  }

  public getAvailableSeats(): Seat[] {
    return this.seats.filter(s => !s.occupied);
  }

  public getAvailableFrontSeats(): Seat[] {
    return this.seats.filter(s => !s.occupied && s.isFrontSeat());
  }

  public getAvailableBackSeats(): Seat[] {
    return this.seats.filter(s => !s.occupied && !s.isFrontSeat());
  }

  public hasAvailableSeats(): boolean {
    return this.getAvailableSeats().length > 0;
  }

  public getRemainingCargoKg(currentCargoKg: number): number {
    return this.type.capacity.maxCargoKg - currentCargoKg;
  }

  public addDocument(doc: DocumentUpload): Vehicle {
    return new Vehicle({
      ...this,
      documents: [...this.documents, doc],
    });
  }

  public hasAllRequiredDocuments(): boolean {
    return REQUIRED_DOCUMENTS.every(reqType =>
      this.documents.some(d => d.type === reqType && d.status === DocumentStatus.APPROVED),
    );
  }

  public getMissingDocuments(): DocumentType[] {
    return REQUIRED_DOCUMENTS.filter(reqType =>
      !this.documents.some(d => d.type === reqType && d.status === DocumentStatus.APPROVED),
    );
  }

  public activate(): Result<Vehicle, Error> {
    if (!this.hasAllRequiredDocuments()) {
      const missing = this.getMissingDocuments();
      return err(new Error(`Missing approved documents: ${missing.join(', ')}`));
    }
    if (!this.hasDashcam) {
      return err(new Error('Dashcam is required to activate vehicle'));
    }
    return ok(new Vehicle({ ...this, status: 'active' }));
  }

  public deactivate(): Vehicle {
    return new Vehicle({ ...this, status: 'inactive' });
  }

  public suspend(): Vehicle {
    return new Vehicle({ ...this, status: 'suspended' });
  }

  public updateLocation(location: Location): Vehicle {
    return new Vehicle({ ...this, currentLocation: location });
  }

  public assignSeat(seatNumber: number, passengerId: UUID): Result<Vehicle, Error> {
    const seatIndex = this.seats.findIndex(s => s.seatNumber === seatNumber);
    if (seatIndex === -1) return err(new Error(`Seat ${seatNumber} not found`));

    const assignResult = this.seats[seatIndex].assign(passengerId);
    if (assignResult.isErr()) return err(assignResult.error);

    const newSeats = [...this.seats];
    newSeats[seatIndex] = assignResult.value;
    return ok(new Vehicle({ ...this, seats: newSeats }));
  }

  public releaseSeat(seatNumber: number): Result<Vehicle, Error> {
    const seatIndex = this.seats.findIndex(s => s.seatNumber === seatNumber);
    if (seatIndex === -1) return err(new Error(`Seat ${seatNumber} not found`));

    const newSeats = [...this.seats];
    newSeats[seatIndex] = this.seats[seatIndex].release();
    return ok(new Vehicle({ ...this, seats: newSeats }));
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      driverId: this.driverId,
      type: this.type.toPrimitives(),
      plate: this.plate,
      brand: this.brand,
      model: this.model,
      year: this.year,
      color: this.color,
      seats: this.seats.map(s => s.toPrimitives()),
      documents: this.documents.map(d => d.toPrimitives()),
      hasDashcam: this.hasDashcam,
      status: this.status,
      currentLocation: this.currentLocation?.toPrimitives(),
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Vehicle {
    return new Vehicle({
      ...props,
      type: VehicleType.fromPrimitives(props.type),
      seats: props.seats.map((s: any) => Seat.fromPrimitives(s)),
      documents: props.documents.map((d: any) => DocumentUpload.fromPrimitives(d)),
      currentLocation: props.currentLocation ? Location.fromPrimitives(props.currentLocation) : undefined,
    });
  }
}
