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

const API_GATEWAY_URL = process.env['NEXT_PUBLIC_API_GATEWAY_URL'] || 'http://localhost:3000';

/**
 * Cliente HTTP puro para el dominio Transport.
 */
export class TransportApiClient {
    private readonly baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || `${API_GATEWAY_URL}/api/transport`;
    }
    
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
                return err(new Error((responseData as any).message || 'Error al solicitar el viaje.'));
            }

            return ok(responseData);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }

    public async getActiveTrip(userId: UUID, token: string): Promise<Result<TripDto | null, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/user/${userId}/active`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error((errorData as any).message || 'Error al obtener el viaje activo.'));
            }

            const data = await response.json();
            return ok(data as TripDto | null);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }
}