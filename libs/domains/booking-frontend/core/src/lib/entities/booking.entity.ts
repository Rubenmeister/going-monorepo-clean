import { Result, ok, err } from 'neverthrow';
import { Money, UUID, Location } from '@going-monorepo-clean/shared-domain'; // Reemplaza con tu scope

// Tipos que el frontend necesita conocer
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type ServiceType = 'transport' | 'accommodation' | 'tour' | 'experience';

export interface BookingProps {
  id: UUID;
  userId: UUID;
  serviceId: UUID; // ID del Trip, Accommodation, o Tour
  serviceType: ServiceType;
  totalPrice: Money;
  status: BookingStatus;
  createdAt: Date;
  startDate: Date;
  endDate?: Date;
}

export class Booking {
  readonly id: UUID;
  readonly userId: UUID;
  readonly serviceId: UUID;
  readonly serviceType: ServiceType;
  readonly totalPrice: Money;
  readonly status: BookingStatus;
  readonly createdAt: Date;
  readonly startDate: Date;
  readonly endDate?: Date;

  constructor(props: BookingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.serviceId = props.serviceId;
    this.serviceType = props.serviceType;
    this.totalPrice = props.totalPrice;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
  }

  // --- Métodos de Persistencia ---
  
  public toPrimitives(): BookingProps {
    return {
      id: this.id,
      userId: this.userId,
      serviceId: this.serviceId,
      serviceType: this.serviceType,
      totalPrice: this.totalPrice.toPrimitives(), // Asume que Money tiene toPrimitives
      status: this.status,
      createdAt: this.createdAt,
      startDate: this.startDate,
      endDate: this.endDate,
    };
  }

  public static fromPrimitives(props: any): Booking {
     // Reconstruye los VOs anidados
    return new Booking({
      ...props,
      totalPrice: Money.fromPrimitives(props.totalPrice),
    });
  }
}