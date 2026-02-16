import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID, Money, Location } from '@going-monorepo-clean/shared-domain';

export type ShipmentStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface ShipmentProps {
  id: UUID;
  senderId: UUID;
  recipientId?: UUID;
  recipientName: string;
  recipientPhone: string;
  origin: Location;
  destination: Location;
  vehicleId?: UUID;
  scheduleId?: UUID;
  description: string;
  weightKg: number;
  price: Money;
  status: ShipmentStatus;
  createdAt: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
}

export class Shipment {
  readonly id: UUID;
  readonly senderId: UUID;
  readonly recipientId?: UUID;
  readonly recipientName: string;
  readonly recipientPhone: string;
  readonly origin: Location;
  readonly destination: Location;
  readonly vehicleId?: UUID;
  readonly scheduleId?: UUID;
  readonly description: string;
  readonly weightKg: number;
  readonly price: Money;
  readonly status: ShipmentStatus;
  readonly createdAt: Date;
  readonly pickedUpAt?: Date;
  readonly deliveredAt?: Date;

  private constructor(props: ShipmentProps) {
    this.id = props.id;
    this.senderId = props.senderId;
    this.recipientId = props.recipientId;
    this.recipientName = props.recipientName;
    this.recipientPhone = props.recipientPhone;
    this.origin = props.origin;
    this.destination = props.destination;
    this.vehicleId = props.vehicleId;
    this.scheduleId = props.scheduleId;
    this.description = props.description;
    this.weightKg = props.weightKg;
    this.price = props.price;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.pickedUpAt = props.pickedUpAt;
    this.deliveredAt = props.deliveredAt;
  }

  public static create(props: {
    senderId: UUID;
    recipientName: string;
    recipientPhone: string;
    recipientId?: UUID;
    origin: Location;
    destination: Location;
    description: string;
    weightKg: number;
    price: Money;
  }): Result<Shipment, Error> {
    if (props.weightKg <= 0) {
      return err(new Error('Weight must be positive'));
    }
    if (!props.price.isPositive()) {
      return err(new Error('Shipment price must be positive'));
    }
    if (!props.recipientName || props.recipientName.length === 0) {
      return err(new Error('Recipient name is required'));
    }
    if (!props.recipientPhone || props.recipientPhone.length < 7) {
      return err(new Error('Recipient phone is required'));
    }

    return ok(new Shipment({
      id: uuidv4(),
      ...props,
      status: 'pending',
      createdAt: new Date(),
    }));
  }

  public assignToVehicle(vehicleId: UUID, scheduleId?: UUID): Result<Shipment, Error> {
    if (this.status !== 'pending') {
      return err(new Error('Shipment is not pending'));
    }
    return ok(new Shipment({
      ...this,
      vehicleId,
      scheduleId,
      status: 'assigned',
    }));
  }

  public pickUp(): Result<Shipment, Error> {
    if (this.status !== 'assigned') {
      return err(new Error('Shipment must be assigned before pickup'));
    }
    return ok(new Shipment({
      ...this,
      status: 'picked_up',
      pickedUpAt: new Date(),
    }));
  }

  public startTransit(): Result<Shipment, Error> {
    if (this.status !== 'picked_up') {
      return err(new Error('Shipment must be picked up before transit'));
    }
    return ok(new Shipment({ ...this, status: 'in_transit' }));
  }

  public deliver(): Result<Shipment, Error> {
    if (this.status !== 'in_transit') {
      return err(new Error('Shipment must be in transit to deliver'));
    }
    return ok(new Shipment({
      ...this,
      status: 'delivered',
      deliveredAt: new Date(),
    }));
  }

  public cancel(): Result<Shipment, Error> {
    if (this.status === 'delivered' || this.status === 'cancelled') {
      return err(new Error('Cannot cancel a delivered or already cancelled shipment'));
    }
    return ok(new Shipment({ ...this, status: 'cancelled' }));
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      senderId: this.senderId,
      recipientId: this.recipientId,
      recipientName: this.recipientName,
      recipientPhone: this.recipientPhone,
      origin: this.origin.toPrimitives(),
      destination: this.destination.toPrimitives(),
      vehicleId: this.vehicleId,
      scheduleId: this.scheduleId,
      description: this.description,
      weightKg: this.weightKg,
      price: this.price.toPrimitives(),
      status: this.status,
      createdAt: this.createdAt,
      pickedUpAt: this.pickedUpAt,
      deliveredAt: this.deliveredAt,
    };
  }

  public static fromPrimitives(props: any): Shipment {
    return new Shipment({
      ...props,
      origin: Location.fromPrimitives(props.origin),
      destination: Location.fromPrimitives(props.destination),
      price: Money.fromPrimitives(props.price),
    });
  }
}
