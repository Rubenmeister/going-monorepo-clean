import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- DTOs de Tracking que vienen del Backend ---
export interface LocationUpdateData {
    driverId: UUID;
    latitude: number;
    longitude: number;
}

export interface DriverLocationDto {
    driverId: UUID;
    location: { latitude: number; longitude: number };
    updatedAt: Date;
}

/**
 * Cliente HTTP/WebSocket puro para el dominio Tracking.
 */
export class TrackingApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/tracking';
    
    /**
     * Lado del conductor: Llama al endpoint HTTP interno para actualizar la ubicación.
     */
    public async updateLocation(data: LocationUpdateData, token: string): Promise<Result<void, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/update-location-internal`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al enviar la ubicación.'));
            }
            
            return ok(undefined);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }

    /**
     * Lado del usuario: Llama al endpoint HTTP para obtener todos los conductores activos.
     */
    public async getActiveDrivers(): Promise<Result<DriverLocationDto[], Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/active-drivers`);
            
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al obtener conductores.'));
            }
            
            const data: DriverLocationDto[] = await response.json();
            return ok(data);
        } catch (error) {
            return err(new Error('Error de red al obtener conductores.'));
        }
    }
}