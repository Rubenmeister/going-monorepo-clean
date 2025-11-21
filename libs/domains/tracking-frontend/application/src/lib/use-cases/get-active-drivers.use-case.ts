import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { TrackingApiClient } from '@going-monorepo-clean/tracking-api-client'; // <--- NUEVA DEPENDENCIA
import { DriverLocationDto } from '@going-monorepo-clean/tracking-api-client';

// --- View Model (Nuevo Modelo Simple para la UI) ---
export interface DriverLocationViewModel {
    driverId: string;
    latitude: number;
    longitude: number;
    updatedAt: Date;
}

@Injectable()
export class GetActiveDriversUseCase {
    private readonly apiClient: TrackingApiClient;

    constructor() {
        this.apiClient = new TrackingApiClient();
    }

    async execute(): Promise<Result<DriverLocationViewModel[], Error>> {
        // 1. Llamar al Adaptador (API Client)
        const result = await this.apiClient.getActiveDrivers();

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 2. Mapear DTOs simples a View Models (Transformación)
        const viewModels: DriverLocationViewModel[] = result.value.map(dto => ({
            driverId: dto.driverId,
            latitude: dto.location.latitude,
            longitude: dto.location.longitude,
            updatedAt: new Date(dto.updatedAt), // Asegurarse de que sea un objeto Date
        }));

        return ok(viewModels);
    }
}