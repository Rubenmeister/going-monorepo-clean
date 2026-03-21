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
    const result = await httpClient.post<Trip>('/transport/request', data);
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async acceptTrip(
    tripId: string,
    driverId: string
  ): Promise<{ message: string }> {
    const result = await httpClient.patch<{ message: string }>(
      `/transport/${tripId}/accept`,
      {
        driverId,
      }
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }
}

export const transportClient = new TransportClient();
