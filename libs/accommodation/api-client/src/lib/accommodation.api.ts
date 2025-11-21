import { Result, ok, err } from 'neverthrow';
import { SearchAccommodationDto } from '@going-monorepo-clean/domains-accommodation-application';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- El DTO que viene del Backend (lo que el backend realmente retorna) ---
// Nota: Es solo una interfaz simple, sin lógica de dominio.
export interface AccommodationDto {
    id: UUID;
    title: string;
    description: string;
    pricePerNight: { amount: number; currency: string };
    location: { address: string; city: string; country: string };
    //... otros campos
}

/**
 * Cliente HTTP puro para el dominio Accommodation.
 * Este es el Adaptador intermedio.
 */
export class AccommodationApiClient {
    private readonly baseUrl = 'http://localhost:3000/api/accommodations';
    
    // El cliente de API no requiere token para buscar
    public async search(filters: SearchAccommodationDto): Promise<Result<AccommodationDto[], Error>> {
        try {
            const params = new URLSearchParams(filters as any);
            const response = await fetch(`${this.baseUrl}/search?${params.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error en la búsqueda.'));
            }
            
            const data: AccommodationDto[] = await response.json();
            return ok(data);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }

    public async getById(id: UUID): Promise<Result<AccommodationDto, Error>> {
        // Lógica para obtener un alojamiento por ID
        // ...
    }
}