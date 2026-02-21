import { httpClient } from './http.client';

export interface CreateBookingRequest {
  userId: string;
  serviceId: string;
  serviceType: 'transport' | 'accommodation' | 'tour' | 'experience' | 'parcel';
  totalPrice: {
    amount: number;
    currency: string;
  };
  startDate: Date | string;
  endDate?: Date | string;
}

export interface Booking {
  id: string;
  userId: string;
  serviceId: string;
  serviceType: string;
  totalPrice: {
    amount: number;
    currency: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export class BookingClient {
  async createBooking(data: CreateBookingRequest): Promise<{ id: string }> {
    const result = await httpClient.post<{ id: string }>('/bookings', data);
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    const result = await httpClient.get<Booking[]>(`/bookings/user/${userId}`);
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async confirmBooking(
    bookingId: string
  ): Promise<{ status: string; message: string }> {
    const result = await httpClient.patch<{ status: string; message: string }>(
      `/bookings/${bookingId}/confirm`,
      {}
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }

  async cancelBooking(
    bookingId: string
  ): Promise<{ status: string; message: string }> {
    const result = await httpClient.patch<{ status: string; message: string }>(
      `/bookings/${bookingId}/cancel`,
      {}
    );
    if (result.isOk()) {
      return result.value;
    }
    throw result.error;
  }
}

export const bookingClient = new BookingClient();
