import { Result } from 'neverthrow';
import { TrackingApiClient, TripRoutePointDto } from '@going-monorepo-clean/tracking-api-client';

export interface RoutePointViewModel {
    latitude: number;
    longitude: number;
    speed: number | null;
    time: string;
}

export class GetTripRouteUseCase {
    private readonly apiClient: TrackingApiClient;

    constructor() {
        this.apiClient = new TrackingApiClient();
    }

    async execute(tripId: string, token: string): Promise<Result<RoutePointViewModel[], Error>> {
        const result = await this.apiClient.getTripRoute(tripId, token);

        return result.map((points: TripRoutePointDto[]) =>
            points.map((p) => ({
                latitude: p.latitude,
                longitude: p.longitude,
                speed: p.speed ?? null,
                time: new Date(p.recordedAt).toLocaleTimeString(),
            })),
        );
    }
}
