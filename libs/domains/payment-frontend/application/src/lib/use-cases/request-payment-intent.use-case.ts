import { Injectable } from '@nestjs/common';
import { Result, ok, err } from 'neverthrow';
import { RequestPaymentDto } from '../dto/request-payment.dto';
import { PaymentApiClient, PaymentRequestData } from '@going-monorepo-clean/payment-api-client';
import { Money } from '@going-monorepo-clean/shared-domain';

export interface PaymentIntentViewModel {
    clientSecret: string;
    amountDollars: number;
    paymentIntentId: string;
}

@Injectable()
export class RequestPaymentIntentUseCase {
    private readonly apiClient: PaymentApiClient;

    constructor() {
        this.apiClient = new PaymentApiClient();
    }

    async execute(dto: RequestPaymentDto, token: string): Promise<Result<PaymentIntentViewModel, Error>> {
        const amountVOResult = Money.create(dto.amount.amount, dto.amount.currency);
        if (amountVOResult.isErr()) return err(amountVOResult.error);

        const requestData: PaymentRequestData = {
            userId: dto.userId,
            referenceId: dto.referenceId,
            amount: amountVOResult.value.toPrimitives(),
        };

        const result = await this.apiClient.requestIntent(requestData, token);

        if (result.isErr()) {
            return err(result.error);
        }

        const intentDto = result.value;
        const viewModel: PaymentIntentViewModel = {
            clientSecret: intentDto.clientSecret,
            paymentIntentId: intentDto.id,
            amountDollars: intentDto.amount.amount / 100,
        };

        return ok(viewModel);
    }
}
