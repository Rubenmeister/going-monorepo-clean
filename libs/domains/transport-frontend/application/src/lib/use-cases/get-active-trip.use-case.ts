import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { TransportApiClient } from '@going-monorepo-clean/transport-api-client';
import { UUID } from '@going-monorepo-clean/shared-domain';
import { TripViewModel } from './request-trip.use-case';

@Injectable()
export class GetActiveTripUseCase {
    private readonly apiClient: TransportApiClient;

    constructor() {
        this.apiClient = new TransportApiClient();
    }

    public async execute(userId: UUID, token: string): Promise<Result<TripViewModel | null, Error>> {
        // TODO: Add a dedicated getActiveTrip endpoint to TransportApiClient
        return ok(null);
    }
}
