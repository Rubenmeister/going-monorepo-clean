import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { TrackingApiClient, LocationUpdateData } from '@going-monorepo-clean/tracking-api-client';
import { LocationUpdateDto } from '../dto/location-update.dto';

@Injectable()
export class BroadcastDriverLocationUseCase {
    private readonly apiClient: TrackingApiClient;

    constructor() {
        this.apiClient = new TrackingApiClient();
    }

    async execute(dto: LocationUpdateDto, token: string): Promise<Result<void, Error>> {
        const requestData: LocationUpdateData = {
            driverId: dto.driverId,
            latitude: dto.latitude,
            longitude: dto.longitude,
        };

        return this.apiClient.updateLocation(requestData, token);
    }
}
