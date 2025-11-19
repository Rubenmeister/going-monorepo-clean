import { Result, ok, err } from 'neverthrow';
import { IDriverLocationRepository, LocationData } from '@going-monorepo-clean/domains-tracking-frontend-core';

const API_GATEWAY = 'http://localhost:3000/api';

/**
 * Adaptador que envía datos al Tracking-Service vía HTTP.
 */
export class HttpLocationRepository implements IDriverLocationRepository {
  
  async sendLocation(data: LocationData, token: string): Promise<Result<void, Error>> {
    try {
      const response = await fetch(`${API_GATEWAY}/tracking/updateLocation`, { // Endpoint interno en el Gateway
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return err(new Error(errorData.message || 'Error al enviar ubicación'));
      }
      return ok(undefined);
    } catch (error) {
      return err(new Error(error.message || 'Error de red al enviar ubicación'));
    }
  }
}