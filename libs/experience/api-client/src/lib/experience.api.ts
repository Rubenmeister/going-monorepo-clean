import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- DTO de Experiencia que viene del Backend ---
export interface ExperienceDto {
    id: UUID;
    title: string;
    description: string;
    price: { amount: number; currency: string };
    location: { address: string; city: string; country: string };
    durationHours: number;
    rating: number;
    images: string[];
}

interface ExperienceFilters {
    city?: string;
    maxPrice?: number;
}

export class ExperienceApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/experiences';
    
    public async search(filters: ExperienceFilters): Promise<Result<ExperienceDto[], Error>> {
        try {
            const params = new URLSearchParams(filters as any);
            const response = await fetch(`${this.baseUrl}/search-published?${params.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error en la búsqueda de experiencias.'));
            }
            
            const data: ExperienceDto[] = await response.json();
            return ok(data);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }
}