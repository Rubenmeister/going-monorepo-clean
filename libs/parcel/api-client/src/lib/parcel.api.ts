import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- DTOs de Parcel que vienen del Backend ---
export interface ParcelDto {
    id: UUID;
    userId: UUID;
    description: string;
    origin: { address: string; city: string; country: string };
    destination: { address: string; city: string; country: string };
    price: { amount: number; currency: string };
    status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
}

export interface CreateParcelRequest {
    userId: UUID;
    origin: any;
    destination: any;
    description: string;
    price: any;
}

export class ParcelApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/parcels';
    
    public async create(data: CreateParcelRequest, token: string): Promise<Result<ParcelDto, Error>> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            
            const responseData: ParcelDto = await response.json();
            
            if (!response.ok) {
                return err(new Error(responseData.message || 'Error al crear el envío.'));
            }
            
            return ok(responseData);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }
}