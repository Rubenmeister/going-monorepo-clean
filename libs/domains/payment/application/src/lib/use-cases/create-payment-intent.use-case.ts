import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { IPaymentRepository } from '../ports/itransaction.repository';
import { IPaymentGateway } from '../ports/ipayment.gateway';
import { PaymentMethodVO } from '../value-objects/payment-method.vo';
import { MoneyVO } from '@myorg/shared/domain/money.vo';
import { Trip } from '@myorg/domains/transport/core'; // Importar desde transport
import { UserId } from '@myorg/domains/user/core';

interface CreatePaymentIntentCommand {
  userId: UserId;
  tripId: string; // ID del viaje compartido
  amount: MoneyVO; // El precio final por pasajero
  paymentMethod: PaymentMethodVO;
}

export class CreatePaymentIntentUseCase {
  constructor(
    private paymentRepo: IPaymentRepository,
    private paymentGateway: IPaymentGateway,
  ) {}

  async execute(command: CreatePaymentIntentCommand): Promise<{ transactionId: string, client_secret: string }> {
    const { userId, tripId, amount, paymentMethod } = command;

    // 1. Crear la transacción en estado PENDING
    const transaction = new Transaction({
      id: UUIDVO.generate(), // Asumiendo que UUIDVO.generate() existe
      userId,
      amount,
      tripId,
    });

    // 2. Llamar al gateway de pagos para crear la intención
    const gatewayResult = await this.paymentGateway.createPaymentIntent(
      amount.toCents(), // Por ejemplo, 1500 para $15.00
      'USD', // O dinámico
      paymentMethod
    );

    // 3. Confirmar la transacción con el ID del gateway
    transaction.confirm(gatewayResult.id);

    // 4. Guardar la transacción en la base de datos
    await this.paymentRepo.save(transaction);

    // 5. Devolver el client_secret para que el frontend lo confirme
    return {
      transactionId: transaction.id.value,
      client_secret: gatewayResult.client_secret,
    };
  }
}