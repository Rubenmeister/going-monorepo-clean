import { v4 as uuidv4 } from 'uuid';
import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

export type ServiceType = 'PASSENGER' | 'DELIVERY' | 'MIXED';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export type ScheduleStatus = 'active' | 'inactive' | 'cancelled';

export interface ScheduleProps {
  id: UUID;
  routeId: UUID;
  vehicleId: UUID;
  driverId: UUID;
  serviceType: ServiceType;
  departureTime: string; // HH:mm format
  arrivalTime: string;   // HH:mm format
  days: DayOfWeek[];
  effectiveFrom: Date;
  effectiveUntil?: Date;
  status: ScheduleStatus;
  createdAt: Date;
}

export class Schedule {
  readonly id: UUID;
  readonly routeId: UUID;
  readonly vehicleId: UUID;
  readonly driverId: UUID;
  readonly serviceType: ServiceType;
  readonly departureTime: string;
  readonly arrivalTime: string;
  readonly days: DayOfWeek[];
  readonly effectiveFrom: Date;
  readonly effectiveUntil?: Date;
  readonly status: ScheduleStatus;
  readonly createdAt: Date;

  private constructor(props: ScheduleProps) {
    this.id = props.id;
    this.routeId = props.routeId;
    this.vehicleId = props.vehicleId;
    this.driverId = props.driverId;
    this.serviceType = props.serviceType;
    this.departureTime = props.departureTime;
    this.arrivalTime = props.arrivalTime;
    this.days = props.days;
    this.effectiveFrom = props.effectiveFrom;
    this.effectiveUntil = props.effectiveUntil;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  private static isValidTime(time: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time);
  }

  public static create(props: {
    routeId: UUID;
    vehicleId: UUID;
    driverId: UUID;
    serviceType: ServiceType;
    departureTime: string;
    arrivalTime: string;
    days: DayOfWeek[];
    effectiveFrom: Date;
    effectiveUntil?: Date;
  }): Result<Schedule, Error> {
    if (!Schedule.isValidTime(props.departureTime)) {
      return err(new Error('Invalid departure time format (use HH:mm)'));
    }
    if (!Schedule.isValidTime(props.arrivalTime)) {
      return err(new Error('Invalid arrival time format (use HH:mm)'));
    }
    if (props.days.length === 0) {
      return err(new Error('At least one day is required'));
    }

    return ok(new Schedule({
      id: uuidv4(),
      ...props,
      status: 'active',
      createdAt: new Date(),
    }));
  }

  public isActiveOnDay(day: DayOfWeek): boolean {
    return this.status === 'active' && this.days.includes(day);
  }

  public isActiveNow(): boolean {
    const now = new Date();
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = dayNames[now.getDay()] as DayOfWeek;

    if (!this.isActiveOnDay(today)) return false;
    if (this.effectiveUntil && now > this.effectiveUntil) return false;
    if (now < this.effectiveFrom) return false;
    return true;
  }

  public acceptsPassengers(): boolean {
    return this.serviceType === 'PASSENGER' || this.serviceType === 'MIXED';
  }

  public acceptsDeliveries(): boolean {
    return this.serviceType === 'DELIVERY' || this.serviceType === 'MIXED';
  }

  public cancel(): Schedule {
    return new Schedule({ ...this, status: 'cancelled' });
  }

  public deactivate(): Schedule {
    return new Schedule({ ...this, status: 'inactive' });
  }

  public toPrimitives(): any {
    return {
      id: this.id,
      routeId: this.routeId,
      vehicleId: this.vehicleId,
      driverId: this.driverId,
      serviceType: this.serviceType,
      departureTime: this.departureTime,
      arrivalTime: this.arrivalTime,
      days: this.days,
      effectiveFrom: this.effectiveFrom,
      effectiveUntil: this.effectiveUntil,
      status: this.status,
      createdAt: this.createdAt,
    };
  }

  public static fromPrimitives(props: any): Schedule {
    return new Schedule(props);
  }
}
