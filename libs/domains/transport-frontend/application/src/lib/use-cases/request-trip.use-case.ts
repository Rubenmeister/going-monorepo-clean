import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { RequestTripDto } from '../dto/request-trip.dto';
import { TransportApiClient, RequestTripRequest } from '@going-monorepo-clean/transport-api-client';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

export interface TripViewModel {
    id: string;
    status: string;
    originCity: string;
    destinationCity: string;
    price: number;
}

@Injectable()
export class RequestTripUseCase {
    private readonly apiClient: TransportApiClient;

    constructor() {
        this.apiClient = new TransportApiClient();
    }

    async execute(dto: RequestTripDto, token: string): Promise<Result<TripViewModel, Error>> {
        // 1. Validaciones de DTO a VOs (Manejo de la lógica del View Model)
        const priceVOResult = Money.create(dto.price.amount, dto.price.currency);
        if (priceVOResult.isErr()) return err(priceVOResult.error);

        // 2. Crear el Request DTO
        const requestData: RequestTripRequest = {
            userId: dto.userId,
            origin: dto.origin,
            destination: dto.destination,
            price: priceVOResult.value.toPrimitives(),
        };

        // 3. Llamar al Adaptador (API Client)
        const result = await this.apiClient.requestTrip(requestData, token);

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 4. Mapear DTOs simples a View Models (Transformación)
        const tripDto = result.value;
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