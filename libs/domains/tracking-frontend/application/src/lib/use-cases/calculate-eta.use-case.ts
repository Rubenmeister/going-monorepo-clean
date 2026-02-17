import { Result } from 'neverthrow';
import { TrackingApiClient, EtaResultDto } from '@going-monorepo-clean/tracking-api-client';

export interface EtaViewModel {
    distanceKm: string;
    estimatedMinutes: string;
}

export class CalculateEtaUseCase {
    private readonly apiClient: TrackingApiClient;

    constructor() {
        this.apiClient = new TrackingApiClient();
    }

    async execute(
        origin: { latitude: number; longitude: number },
        destination: { latitude: number; longitude: number },
        token: string,
    ): Promise<Result<EtaViewModel, Error>> {
        const result = await this.apiClient.calculateEta(origin, destination, token);

        return result.map((dto: EtaResultDto) => ({
            distanceKm: `${dto.distanceKm.toFixed(1)} km`,
            estimatedMinutes: `${Math.round(dto.estimatedMinutes)} min`,
        }));
    }
}
