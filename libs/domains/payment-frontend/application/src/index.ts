import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { RequestPaymentDto } from '../dto/request-payment.dto';
import { PaymentApiClient } from '@going-monorepo-clean/payment-api-client'; // <--- NUEVA DEPENDENCIA
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Money } from '@going-monorepo-clean/shared-domain';

// --- View Model (Nuevo Modelo Simple para la UI) ---
export interface PaymentIntentViewModel {
    clientSecret: string;
    amountDollars: number;
    paymentIntentId: string;
}

@Injectable()
export class RequestPaymentIntentUseCase {
    private readonly apiClient: PaymentApiClient;
    private readonly authRepository: IAuthRepository;

    constructor(authRepository: IAuthRepository /* La inyección real de tu provider */) {
        // Instanciamos el cliente de API (Adaptador) directamente aquí.
        this.apiClient = new PaymentApiClient(); 
        this.authRepository = authRepository;
    }

    async execute(dto: RequestPaymentDto): Promise<Result<PaymentIntentViewModel, Error>> {
        const sessionResult = await this.authRepository.loadSession();
        if (sessionResult.isErr() || !sessionResult.value) {
            return err(new Error('No estás autenticado.'));
        }
        const token = sessionResult.value.token;
        
        // 1. Validaciones de DTO a VOs
        const amountVOResult = Money.create(dto.amount.amount, dto.amount.currency);
        if (amountVOResult.isErr()) return err(amountVOResult.error);

        // 2. Crear el Request DTO
        const requestData: PaymentRequestData = {
            userId: dto.userId,
            referenceId: dto.referenceId,
            amount: amountVOResult.value.toPrimitives(),
        };

        // 3. Llamar al Adaptador (API Client)
        const result = await this.apiClient.requestIntent(requestData, token);

        if (result.isErr()) {
            return err(result.error);
        }
        
        // 4. Mapear DTOs simples a View Models (Transformación)
        const intentDto = result.value;
        const viewModel: PaymentIntentViewModel = {
            clientSecret: intentDto.clientSecret,
            paymentIntentId: intentDto.id,
            amountDollars: intentDto.amount.amount / 100, // Convierte centavos a dólares
        };

        return ok(viewModel);
    }
}