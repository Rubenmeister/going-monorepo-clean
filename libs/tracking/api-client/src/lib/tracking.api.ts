import { Result, ok, err } from 'neverthrow';
import { UUID } from '@going-monorepo-clean/shared-domain';

// --- DTOs de Tracking que vienen del Backend ---
export interface LocationUpdateData {
    driverId: UUID;
    latitude: number;
    longitude: number;
    tripId?: UUID;
    speed?: number;
    heading?: number;
    accuracy?: number;
}

export interface DriverLocationDto {
    driverId: UUID;
    location: { latitude: number; longitude: number };
    updatedAt: Date;
}

export interface DriverLocationForTripDto {
    driverId: UUID;
    tripId: UUID;
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    updatedAt: Date;
    etaMinutes?: number;
}

export interface EtaResultDto {
    distanceKm: number;
    estimatedMinutes: number;
    averageSpeedKmh: number;
}

export interface TripRoutePointDto {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
    recordedAt: Date;
}

const API_GATEWAY_URL = process.env['NEXT_PUBLIC_API_GATEWAY_URL'] || 'http://localhost:3000';

/**
 * Cliente HTTP para Tracking + Geolocation.
 */
export class TrackingApiClient {
    private readonly baseUrl: string;
    private readonly geoUrl: string;

    constructor(baseUrl?: string) {
        const gateway = baseUrl || `${API_GATEWAY_URL}/api`;
        this.baseUrl = `${gateway}/tracking`;
        this.geoUrl = `${gateway}/geolocation`;
    }

    // --- Tracking ---

    public async updateLocation(data: LocationUpdateData, token: string): Promise<Result<void, Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/update-location-internal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al enviar la ubicación.'));
            }
            return ok(undefined);
        } catch (error) {
            return err(new Error('Error de red al conectar con el Gateway.'));
        }
    }

    public async getActiveDrivers(): Promise<Result<DriverLocationDto[], Error>> {
        try {
            const response = await fetch(`${this.baseUrl}/active-drivers`);
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al obtener conductores.'));
            }
            const data: DriverLocationDto[] = await response.json();
            return ok(data);
        } catch (error) {
            return err(new Error('Error de red al obtener conductores.'));
        }
    }

    // --- Geolocation: Location History ---

    public async saveLocationHistory(data: LocationUpdateData, token: string): Promise<Result<void, Error>> {
        try {
            const response = await fetch(`${this.geoUrl}/history`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al guardar historial.'));
            }
            return ok(undefined);
        } catch (error) {
            return err(new Error('Error de red al guardar historial.'));
        }
    }

    public async getTripRoute(tripId: UUID, token: string): Promise<Result<TripRoutePointDto[], Error>> {
        try {
            const response = await fetch(`${this.geoUrl}/trip/${tripId}/route`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al obtener la ruta.'));
            }
            return ok(await response.json());
        } catch (error) {
            return err(new Error('Error de red al obtener la ruta.'));
        }
    }

    // --- Geolocation: Driver Location for Trip ---

    public async getDriverLocationForTrip(
        tripId: UUID,
        driverId: UUID,
        token: string,
        destLat?: number,
        destLng?: number,
    ): Promise<Result<DriverLocationForTripDto, Error>> {
        try {
            let url = `${this.geoUrl}/trip/${tripId}/driver/${driverId}`;
            const params = new URLSearchParams();
            if (destLat !== undefined) params.set('destLat', String(destLat));
            if (destLng !== undefined) params.set('destLng', String(destLng));
            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al obtener ubicación del conductor.'));
            }
            return ok(await response.json());
        } catch (error) {
            return err(new Error('Error de red.'));
        }
    }

    // --- Geolocation: ETA ---

    public async calculateEta(
        origin: { latitude: number; longitude: number },
        destination: { latitude: number; longitude: number },
        token: string,
    ): Promise<Result<EtaResultDto, Error>> {
        try {
            const response = await fetch(`${this.geoUrl}/eta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    originLatitude: origin.latitude,
                    originLongitude: origin.longitude,
                    destinationLatitude: destination.latitude,
                    destinationLongitude: destination.longitude,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                return err(new Error(errorData.message || 'Error al calcular ETA.'));
            }
            return ok(await response.json());
        } catch (error) {
            return err(new Error('Error de red al calcular ETA.'));
        }
    }
}
