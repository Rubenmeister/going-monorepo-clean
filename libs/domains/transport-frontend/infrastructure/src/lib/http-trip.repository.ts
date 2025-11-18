import { Result, ok, err } from 'neverthrow';
import {
  Trip,
  ITripRepository,
  RequestTripData,
} from '@going-monorepo-clean/domains-transport-core'; // Reemplaza con tu scope
import { UUID } from '@going-monorepo-clean/shared-domain';

// Esta es la URL de tu API Gateway (la pondrías en un .env de frontend)
const API_GATEWAY_URL = 'http://localhost:3000/api';

/**
 * Esta es la implementación "Adaptador" del puerto ITripRepository.
 * Sabe cómo hablar con el API Gateway (HTTP).
 */
export class HttpTripRepository implements ITripRepository {
  
  public async request(data: RequestTripData, token: string): Promise<Result<Trip, Error>> {
    try {
      // 1. Convierte los VOs a primitivos para el JSON
      const body = {
        userId: data.userId,
        origin: data.origin.toPrimitives(),
        destination: data.destination.toPrimitives(),
        price: data.price.toPrimitives(),
      };

      // 2. Llama al endpoint /api/transport/request de tu Gateway
      const response = await fetch(`${API_GATEWAY_URL}/transport/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Adjunta el token
        },
        body: JSON.stringify(body),
      });

      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al solicitar el viaje'));
      }

      // 3. Transforma la respuesta en la entidad del dominio
      const trip = Trip.fromPrimitives(responseData);
      return ok(trip);
      
    } catch (error) {
      return err(new Error(error.message || 'Error de red al solicitar el viaje'));
    }
  }

  public async getActiveTrip(userId: UUID, token: string): Promise<Result<Trip | null, Error>> {
    try {
      // 4. Llama al endpoint (asumimos que crearemos este endpoint en el backend)
      const response = await fetch(`${API_GATEWAY_URL}/transport/user/${userId}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 404) {
        return ok(null); // No hay viaje activo
      }
      
      const responseData = await response.json();

      if (!response.ok) {
        return err(new Error(responseData.message || 'Error al obtener el viaje activo'));
      }

      const trip = Trip.fromPrimitives(responseData);
      return ok(trip);

    } catch (error) {
      return err(new Error('Error de red al obtener el viaje'));
    }
  }

  public async cancel(tripId: UUID, token: string): Promise<Result<void, Error>> {
    try {
      // 5. Llama al endpoint para cancelar
      const response = await fetch(`${API_GATEWAY_URL}/transport/${tripId}/cancel`, {
        method: 'PATCH', // O 'POST', según tu diseño de API
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const responseData = await response.json();
        return err(new Error(responseData.message || 'Error al cancelar el viaje'));
      }

      return ok(undefined);

    } catch (error) {
      return err(new Error('Error de red al cancelar el viaje'));
    }
  }
}