import { BookingStatus } from '../value-objects/booking-status.vo';
import { ServiceType } from '../value-objects/service-type.vo';

export class Booking {
  id: string;
  userId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  // Agrega createdAt/updatedAt si los usas

  constructor(props: { id: string; userId: string; serviceType: ServiceType; status: BookingStatus }) {
    this.id = props.id;
    this.userId = props.userId;
    this.serviceType = props.serviceType;
    this.status = props.status;
  }

  // Método para convertir a objeto plano (para guardar en DB)
  toPrimitives(): any {
    return {
      id: this.id,
      userId: this.userId,
      serviceType: this.serviceType,
      status: this.status,
    };
  }

  // Método estático para recrear la entidad desde la DB
  static fromPrimitives(props: any): Booking {
    return new Booking({
      id: props.id,
      userId: props.userId,
      serviceType: props.serviceType,
      status: props.status,
    });
  }
}