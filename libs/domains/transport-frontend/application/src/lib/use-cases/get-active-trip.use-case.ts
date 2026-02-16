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
        const result = await this.apiClient.getActiveTrip(userId, token);

        if (result.isErr()) {
            return err(result.error);
        }

        const tripDto = result.value;
        if (!tripDto) {
            return ok(null);
        }

        const viewModel: TripViewModel = {
            id: tripDto.id,
            status: tripDto.status,
            originCity: tripDto.origin.city,
            destinationCity: tripDto.destination.city,
            price: tripDto.price.amount / 100,
        };

        return ok(viewModel);
    }
}
