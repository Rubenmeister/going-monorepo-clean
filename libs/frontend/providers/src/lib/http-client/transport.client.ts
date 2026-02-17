import { httpClient } from './http.client';

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export interface RequestTripRequest {
  userId: string;
  origin: Location;
  destination: Location;
  price: {
    amount: number;
    currency: string;
  };
}

export interface Trip {
  id: string;
  userId: string;
  origin: Location;
  destination: Location;
  price: {
    amount: number;
    currency: string;
  };
  status: string;
  createdAt: string;
}

export class TransportClient {
  async requestTrip(data: RequestTripRequest): Promise<Trip> {
    return httpClient.post<Trip>('/transport/request', data);
  }

  async acceptTrip(tripId: string, driverId: string): Promise<{ message: string }> {
    return httpClient.patch<{ message: string }>(`/transport/${tripId}/accept`, {
      driverId,
    });
  }
}

export const transportClient = new TransportClient();
