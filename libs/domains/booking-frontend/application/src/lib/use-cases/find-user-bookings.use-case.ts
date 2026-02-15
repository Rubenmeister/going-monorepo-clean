import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { BookingApiClient } from '@going-monorepo-clean/booking-api-client';
import { UUID } from '@going-monorepo-clean/shared-domain';

export interface BookingListViewModel {
    id: string;
    serviceType: string;
    totalPrice: number;
    status: string;
    startDate: Date;
}

@Injectable()
export class FindUserBookingsUseCase {
    private readonly apiClient: BookingApiClient;

    constructor() {
        this.apiClient = new BookingApiClient();
    }

    public async execute(userId: UUID, token: string): Promise<Result<BookingListViewModel[], Error>> {
        const result = await this.apiClient.getByUser(userId, token);

        if (result.isErr()) {
            return err(result.error);
        }

        const viewModels: BookingListViewModel[] = result.value.map(dto => ({
            id: dto.id,
            serviceType: dto.serviceType,
            totalPrice: dto.totalPrice.amount / 100,
            status: dto.status,
            startDate: dto.startDate,
        }));

        return ok(viewModels);
    }
}
