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
    return httpClient.post<{ id: string }>('/bookings', data);
  }

  async getBookingsByUser(userId: string): Promise<Booking[]> {
    return httpClient.get<Booking[]>(`/bookings/user/${userId}`);
  }

  async confirmBooking(bookingId: string): Promise<{ status: string; message: string }> {
    return httpClient.patch<{ status: string; message: string }>(
      `/bookings/${bookingId}/confirm`,
      {}
    );
  }

  async cancelBooking(bookingId: string): Promise<{ status: string; message: string }> {
    return httpClient.patch<{ status: string; message: string }>(
      `/bookings/${bookingId}/cancel`,
      {}
    );
  }
}

export const bookingClient = new BookingClient();
