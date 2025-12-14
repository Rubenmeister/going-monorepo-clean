import { BookingStatus } from '../value-objects/booking-status.vo';
import { ServiceType } from '../value-objects/service-type.vo';

export class Booking {
  id: string;
  userId: string;
  serviceType: ServiceType;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Booking>) {
    Object.assign(this, partial);
  }
}