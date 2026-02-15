import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- DTO de Tour que viene del Backend ---
export interface TourDto {
    id: UUID;
    title: string;
    description: string;
    price: { amount: number; currency: string };
    location: { address: string; city: string; country: string };
    durationHours: number;
    category: string;
}

interface TourFilters {
    city?: string;
    category?: string;
}

const API_GATEWAY_URL = process.env['NEXT_PUBLIC_API_GATEWAY_URL'] || 'http://localhost:3000';

export class TourApiClient {
    private readonly baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || `${API_GATEWAY_URL}/api/tours`;
    }
    
    public async search(filters: TourFilters): Promise<Result<TourDto[], Error>> {
        try {
            const params = new URLSearchParams(filters as any);
            const response = await fetch(`${this.baseUrl}/search-published?${params.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error en la búsqueda de tours.'));
            }
            
            const data: TourDto[] = await response.json();
            return ok(data);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }
}