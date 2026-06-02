import { Result } from 'neverthrow';

export type ServiceType = 'ACCOMMODATION' | 'TOUR' | 'EXPERIENCE' | 'TRANSPORT' | 'PARCEL';

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  serviceType: string;
  totalPrice: { amount: number; currency: string };
  status: string;
  startDate: Date;
  endDate?: Date;
}

export interface CreateBookingRequest {
  userId: string;
  serviceId: string;
  serviceType: string;
  totalPrice: { amount: number; currency: string };
  startDate: Date;
  endDate?: Date;
}

export const IBookingRepository = Symbol('IBookingRepository');

export interface IBookingRepository {
  create(data: CreateBookingRequest, token: string): Promise<Result<Booking, Error>>;
  findById(bookingId: string, token: string): Promise<Result<Booking | null, Error>>;
  getByUser(userId: string, token: string): Promise<Result<Booking[], Error>>;
  cancel(bookingId: string, token: string): Promise<Result<void, Error>>;
  confirm(bookingId: string, token: string): Promise<Result<Booking, Error>>;
}
