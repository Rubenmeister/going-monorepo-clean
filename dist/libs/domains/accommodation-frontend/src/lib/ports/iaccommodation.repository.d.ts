import { Result } from 'neverthrow';
import { Accommodation } from '../entities/accommodation.entity';
import { UUID } from '@going-monorepo-clean/shared-domain';
export interface SearchFilters {
    city?: string;
    checkIn?: Date;
    checkOut?: Date;
    guests?: number;
}
export declare const IAccommodationRepository: unique symbol;
export interface IAccommodationRepository {
    search(filters: SearchFilters): Promise<Result<Accommodation[], Error>>;
    getById(id: UUID): Promise<Result<Accommodation | null, Error>>;
}
