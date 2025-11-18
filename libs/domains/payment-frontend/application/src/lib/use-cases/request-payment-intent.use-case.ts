import { Inject, Injectable } from '@nestjs/common';
import { Result, err } from 'neverthrow';
import {
  PaymentIntent,
  IPaymentGateway,
  PaymentRequestData,
} from '@going-monorepo-clean/domains-payment-frontend-core'; // Reemplaza con tu scope
import { IAuthRepository } from '@going-monorepo-clean/domains-user-frontend-core';
import { Money } from '@going-monorepo-clean/shared-domain';
import { RequestPaymentDto } from '../dto/request-payment.dto';

@Injectable()
export class RequestPaymentIntentUseCase {
  constructor(
    // Inyecta el puerto del Gateway (que hará la llamada HTTP)
    @Inject(IPaymentGateway)
    private readonly paymentGateway: IPaymentGateway,
    // Inyecta el puerto de Auth (para obtener el token)
    @Inject(IAuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  public async execute(dto: RequestPaymentDto): Promise<Result<PaymentIntent, Error>> {
    // 1. Obtener el token de la sesión actual
    const sessionResult = await this.authRepository.loadSession();
    if (sessionResult.isErr() || !sessionResult.value) {
      return err(new Error('No estás autenticado. Por favor, inicia sesión.'));
    }
    const token = sessionResult.value.token;

    // 2. Convertir el DTO a los Value Objects del dominio
    const amountVOResult = Money.create(dto.amount.amount, dto.amount.currency);
    if (amountVOResult.isErr()) {
      return err(amountVOResult.error);
    }

    // 3. Crear el objeto de datos para el repositorio
    const requestData: PaymentRequestData = {
      userId: dto.userId,
      referenceId: dto.referenceId,
      amount: amountVOResult.value,
    };

    // 4. Llamar al "Puerto" del Gateway (que hará la llamada HTTP)
    return this.paymentGateway.requestIntent(requestData, token);
  }
}