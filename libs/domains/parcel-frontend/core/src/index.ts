import { Result } from 'neverthrow';

export interface Parcel {
  id: string;
  userId: string;
  origin: { city: string; lat: number; lng: number };
  destination: { city: string; lat: number; lng: number };
  description: string;
  price: { amount: number; currency: string };
  status: string;
}

export interface CreateParcelRequest {
  userId: string;
  origin: { city: string; lat: number; lng: number };
  destination: { city: string; lat: number; lng: number };
  description: string;
  price: { amount: number; currency: string };
}

export const IParcelRepository = Symbol('IParcelRepository');

export interface IParcelRepository {
  create(data: CreateParcelRequest, token: string): Promise<Result<Parcel, Error>>;
  findByUserId(userId: string, token: string): Promise<Result<Parcel[], Error>>;
  findByTrackingCode(code: string, token: string): Promise<Result<Parcel | null, Error>>;
}
