import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { TrackingApiClient } from '@going-monorepo-clean/tracking-api-client'; // <--- NUEVA DEPENDENCIA
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { LocationUpdateDto } from '../dto/location-update.dto';

@Injectable()
export class BroadcastDriverLocationUseCase {
    private readonly apiClient: TrackingApiClient;
    private readonly authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository /* La inyección real de tu provider */) {
        this.apiClient = new TrackingApiClient(); 
        this.authRepository = authRepository;
    }

    async execute(dto: LocationUpdateDto): Promise<Result<void, Error>> {
        const sessionResult = await this.authRepository.loadSession();
        if (sessionResult.isErr() || !sessionResult.value) {
            return err(new Error('No estás autenticado.'));
        }
        const token = sessionResult.value.token;

        // El DTO de entrada ya es casi lo que el API necesita.
        const requestData: LocationUpdateData = {
            driverId: dto.driverId,
            latitude: dto.latitude,
            longitude: dto.longitude,
        };

        // 3. Llamar al Adaptador (API Client)
        return this.apiClient.updateLocation(requestData, token);
    }
}