import { Result } from 'neverthrow';
import { TrackingApiClient, DriverLocationForTripDto } from '@going-monorepo-clean/tracking-api-client';

export interface TrackDriverViewModel {
    driverId: string;
    tripId: string;
    latitude: number;
    longitude: number;
    etaMinutes: number | null;
    updatedAt: string;
}

export class TrackDriverForTripUseCase {
    private readonly apiClient: TrackingApiClient;

    constructor() {
        this.apiClient = new TrackingApiClient();
    }

    async execute(
        tripId: string,
        driverId: string,
        token: string,
        destLat?: number,
        destLng?: number,
    ): Promise<Result<TrackDriverViewModel, Error>> {
        const result = await this.apiClient.getDriverLocationForTrip(tripId, driverId, token, destLat, destLng);

        return result.map((dto: DriverLocationForTripDto) => ({
            driverId: dto.driverId,
            tripId: dto.tripId,
            latitude: dto.latitude,
            longitude: dto.longitude,
            etaMinutes: dto.etaMinutes ?? null,
            updatedAt: new Date(dto.updatedAt).toLocaleTimeString(),
        }));
    }
}
