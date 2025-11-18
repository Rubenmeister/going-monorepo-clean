import { Result, ok, err } from 'neverthrow';
import {
  Booking,
  IBookingRepository,
  CreateBookingData,
} from '@going-monorepo-clean/domains-booking-core'; // Reemplaza con tu scope
import { UUID } from '@going-monorepo-clean/shared-domain';

// Esta es la URL de tu API Gateway (la pondrías en un .env de frontend)
const API_GATEWAY_URL = 'http://localhost:3000/api';

/**
 * Esta es la implementación "Adaptador" del puerto IBookingRepository.
 * Sabe cómo hablar con el API Gateway (HTTP).
 */
export class HttpBookingRepository implements IBookingRepository {
  
  public async create(data: CreateBookingData, token: string): Promise<Result<Booking, Error>> {
    try {
      // 1. Llama al endpoint /api/bookings de tu Gateway
      const response = await fetch(`${API_GATEWAY_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Adjunta el token
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al crear la reserva'));
      }

      // 2. Transforma la respuesta en la entidad del dominio
      const booking = Booking.fromPrimitives(responseData);
      return ok(booking);
      
    } catch (error) {
      return err(new Error(error.message || 'Error de red al crear la reserva'));
    }
  }

  public async getByUser(userId: UUID, token: string): Promise<Result<Booking[], Error>> {
    try {
      // 3. Llama al endpoint /api/bookings/user/:userId de tu Gateway
      const response = await fetch(`${API_GATEWAY_URL}/bookings/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Adjunta el token
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al obtener las reservas'));
      }

      // 4. Transforma la respuesta en un array de entidades
      const bookings = responseData.map((bookingData: any) => Booking.fromPrimitives(bookingData));
      return ok(bookings);

    } catch (error) {
      return err(new Error('Error de red al obtener las reservas'));
    }
  }
}