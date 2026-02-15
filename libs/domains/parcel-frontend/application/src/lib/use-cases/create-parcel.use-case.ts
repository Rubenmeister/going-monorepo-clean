import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { ParcelApiClient, CreateParcelRequest } from '@going-monorepo-clean/parcel-api-client';
import { CreateParcelDto } from '../dto/create-parcel.dto';
import { Money, Location } from '@going-monorepo-clean/shared-domain';

export interface ParcelViewModel {
    id: string;
    status: string;
    price: number;
}

@Injectable()
export class CreateParcelUseCase {
    private readonly apiClient: ParcelApiClient;

    constructor() {
        this.apiClient = new ParcelApiClient();
    }

    async execute(dto: CreateParcelDto, token: string): Promise<Result<ParcelViewModel, Error>> {
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
