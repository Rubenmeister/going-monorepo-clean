import { Result } from 'neverthrow';

export interface Trip {
  id: string;
  userId: string;
  origin: { city: string; lat: number; lng: number };
  destination: { city: string; lat: number; lng: number };
  price: { amount: number; currency: string };
  status: string;
}

export interface TripRequest {
  userId: string;
  origin: { city: string; lat: number; lng: number };
  destination: { city: string; lat: number; lng: number };
  price: { amount: number; currency: string };
}

export const ITripRepository = Symbol('ITripRepository');

export interface ITripRepository {
  requestTrip(data: TripRequest, token: string): Promise<Result<Trip, Error>>;
  getActiveTrip(userId: string, token: string): Promise<Result<Trip | null, Error>>;
  findById(id: string, token: string): Promise<Result<Trip | null, Error>>;
  findByUserId(userId: string, token: string): Promise<Result<Trip[], Error>>;
}
