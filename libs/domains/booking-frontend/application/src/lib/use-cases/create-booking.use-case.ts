import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { BookingApiClient } from '@going-monorepo-clean/booking-api-client'; // <--- NUEVA DEPENDENCIA
import { Money } from '@going-monorepo-clean/shared-domain';

// --- View Model (Nuevo Modelo Simple para la UI) ---
export interface BookingViewModel {
    id: string;
    totalPrice: number; // Ya en dólares
    serviceType: string;
    status: string;
    startDate: Date;
}

@Injectable()
export class CreateBookingUseCase {
    private readonly apiClient: BookingApiClient;

    constructor() {
        // Instanciamos el cliente de API (Adaptador) directamente aquí.
        this.apiClient = new BookingApiClient(); 
    }

    async execute(dto: CreateBookingDto, token: string): Promise<Result<BookingViewModel, Error>> {
        // 1. Validaciones de DTO a VOs (Si es necesario)
        const priceVOResult = Money.create(dto.totalPrice.amount, dto.totalPrice.currency);
        if (priceVOResult.isErr()) return err(priceVOResult.error);

        // 2. Crear el Request DTO
        const requestData = {
            userId: dto.userId,
            serviceId: dto.serviceId,
            serviceType: dto.serviceType,
            totalPrice: priceVOResult.value.toPrimitives(),
            startDate: dto.startDate,
            endDate: dto.endDate,
        };

        // 3. Llamar al Adaptador (API Client)
        const result = await this.apiClient.create(requestData, token);

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 4. Mapear DTOs simples a View Models (Transformación)
        const bookingDto = result.value;
        const viewModel: BookingViewModel = {
            id: bookingDto.id,
            totalPrice: bookingDto.totalPrice.amount / 100, // Convierte centavos a dólares
            serviceType: bookingDto.serviceType,
            status: bookingDto.status,
            startDate: bookingDto.startDate,
        };

        return ok(viewModel);
    }
}