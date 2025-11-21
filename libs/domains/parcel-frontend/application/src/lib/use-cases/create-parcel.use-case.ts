import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { ParcelApiClient } from '@going-monorepo-clean/parcel-api-client';
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { CreateParcelDto } from '../dto/create-parcel.dto';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

// --- View Model (Nuevo Modelo Simple para la UI) ---
export interface ParcelViewModel {
    id: string;
    status: string;
    price: number;
}

@Injectable()
export class CreateParcelUseCase {
    private readonly apiClient: ParcelApiClient;
    private readonly authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository) {
        this.apiClient = new ParcelApiClient();
        this.authRepository = authRepository;
    }

    async execute(dto: CreateParcelDto): Promise<Result<ParcelViewModel, Error>> {
        const sessionResult = await this.authRepository.loadSession();
        if (sessionResult.isErr() || !sessionResult.value) {
            return err(new Error('No estás autenticado.'));
        }
        const token = sessionResult.value.token;

        const priceVOResult = Money.create(dto.price.amount, dto.price.currency);
        if (priceVOResult.isErr()) return err(priceVOResult.error);

        const originVOResult = Location.create(dto.origin);
        const destinationVOResult = Location.create(dto.destination);
        if (originVOResult.isErr() || destinationVOResult.isErr()) return err(new Error("Ubicación inválida."));

        const requestData: CreateParcelRequest = {
            userId: dto.userId,
            origin: originVOResult.value.toPrimitives(),
            destination: destinationVOResult.value.toPrimitives(),
            description: dto.description,
            price: priceVOResult.value.toPrimitives(),
        };

        const result = await this.apiClient.create(requestData, token);

        if (result.isErr()) return err(result.error);
        
        const parcelDto = result.value;
        const viewModel: ParcelViewModel = {
            id: parcelDto.id,
            status: parcelDto.status,
            price: parcelDto.price.amount / 100,
        };

        return ok(viewModel);
    }
}