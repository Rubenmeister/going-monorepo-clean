import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- El DTO de Viaje que viene del Backend (sin lógica de dominio) ---
export interface TripDto {
    id: UUID;
    userId: UUID;
    driverId?: UUID;
    origin: { address: string; city: string; country: string; latitude: number; longitude: number; };
    destination: { address: string; city: string; country: string; latitude: number; longitude: number; };
    price: { amount: number; currency: string };
    status: 'pending' | 'driver_assigned' | 'in_progress' | 'completed' | 'cancelled';
}

export interface RequestTripRequest {
    userId: UUID;
    origin: any;
    destination: any;
    price: any;
}

/**
 * Cliente HTTP puro para el dominio Transport.
 */
export class TransportApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/transport';
    
    public async requestTrip(data: RequestTripRequest, token: string): Promise<Result<TripDto, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/request`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            
            const responseData: TripDto = await response.json();
            
            if (!response.ok) {
                return err(new Error(responseData.message || 'Error al solicitar el viaje.'));
            }
            
            return ok(responseData);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }
}