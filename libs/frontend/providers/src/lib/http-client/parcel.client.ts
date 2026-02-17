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
    return httpClient.post<{ id: string }>('/parcels', data);
  }

  async getParcelsByUser(userId: string): Promise<Parcel[]> {
    return httpClient.get<Parcel[]>(`/parcels/user/${userId}`);
  }
}

export const parcelClient = new ParcelClient();
