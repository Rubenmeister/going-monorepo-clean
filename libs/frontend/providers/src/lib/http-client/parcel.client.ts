import { httpClient } from './http.client';

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export interface CreateParcelRequest {
  userId: string;
  origin: Location;
  destination: Location;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
}

export interface Parcel {
  id: string;
  userId: string;
  origin: Location;
  destination: Location;
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  status: string;
  createdAt: string;
}

export class ParcelClient {
  async createParcel(data: CreateParcelRequest): Promise<{ id: string }> {
    const result = await httpClient.post<{ id: string }>('/parcels', data);
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async getParcelsByUser(userId: string): Promise<Parcel[]> {
    const result = await httpClient.get<Parcel[]>(`/parcels/user/${userId}`);
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }
}

export const parcelClient = new ParcelClient();
