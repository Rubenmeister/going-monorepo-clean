import { UUID } from '@going-monorepo-clean/shared-domain';
import { Result, ok, err } from 'neverthrow';

// Definimos los posibles estados de una reserva
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface BookingProps {
  id: UUID;
  userId: UUID; // Usuario que hace la reserva
  experienceId: UUID; // Referencia al servicio/producto reservado
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  status: BookingStatus;
  paymentId?: string; // ID de transacción después de la confirmación
  createdAt: Date;
}

export class Booking {
  readonly id: UUID;
  readonly userId: UUID;
  readonly experienceId: UUID;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly totalPrice: number;
  readonly status: BookingStatus;
  readonly paymentId?: string;
  readonly createdAt: Date;

  private constructor(props: BookingProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.experienceId = props.experienceId;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.totalPrice = props.totalPrice;
    this.status = props.status;
    this.paymentId = props.paymentId;
    this.createdAt = props.createdAt;
  }

  // Lógica de Negocio: Fábrica para crear una nueva reserva
  public static create(props: {
    userId: UUID;
    experienceId: UUID;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
  }): Result<Booking, Error> {
    // ⚠️ Ejemplo de validación de Dominio
    if (props.startDate >= props.endDate) {
      return err(new Error('Start date must be before end date.'));
    }

    const booking = new Booking({
      ...props,
      id: new UUID(), // Asumimos que la librería UUID tiene un método para generar
      status: 'pending', // Siempre comienza como pendiente
      createdAt: new Date(),
    });

    return ok(booking);
  }

  // Lógica de Negocio: Confirmar el pago
  public confirm(paymentId: string): Result<void, Error> {
    if (this.status !== 'pending') {
      return err(new Error(`Booking is already ${this.status}. Only 'pending' can be confirmed.`));
    }
    (this as any).status = 'confirmed';
    (this as any).paymentId = paymentId;
    return ok(undefined);
  }
  
  // Lógica de Negocio: Cancelar la reserva
  public cancel(): Result<void, Error> {
    if (this.status === 'completed' || this.status === 'cancelled') {
      return err(new Error(`Booking cannot be cancelled if it is already ${this.status}.`));
    }
    (this as any).status = 'cancelled';
    return ok(undefined);
  }

  // Mapeo a Primitivos (requerido por el adaptador de Prisma)
  public toPrimitives(): BookingProps {
    // Nota: Aquí se deben mapear los UUID a string si es necesario.
    return {
      id: this.id.toString(), 
      userId: this.userId.toString(),
      experienceId: this.experienceId.toString(),
      startDate: this.startDate,
      endDate: this.endDate,
      totalPrice: this.totalPrice,
      status: this.status,
      paymentId: this.paymentId,
      createdAt: this.createdAt,
    } as any;
  }
}