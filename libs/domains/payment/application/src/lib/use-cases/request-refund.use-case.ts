import { Refund, RefundStatus } from '../entities/refund.entity';
import { IRefundRepository } from '../ports/irefund.repository';
import { IPaymentGateway } from '../ports/ipayment.gateway';
import { ITransactionRepository } from '../ports/itransaction.repository';
import { MoneyVO } from '@myorg/shared/domain/money.vo';
import { UUIDVO } from '@myorg/shared/domain/uuid.vo';

interface RequestRefundCommand {
  transactionId: string;
  amount?: MoneyVO; // Si no se especifica, se reembolsa el total
  reason?: string;
}

export class RequestRefundUseCase {
  constructor(
    private refundRepo: IRefundRepository,
    private paymentGateway: IPaymentGateway,
    private transactionRepo: ITransactionRepository,
  ) {}

  async execute(command: RequestRefundCommand): Promise<Refund> {
    const { transactionId, amount, reason } = command;

    // 1. Validar que la transacción exista y esté confirmada
    const transaction = await this.transactionRepo.findById(transactionId);
    if (!transaction) {
      throw new Error('Transacción no encontrada.');
    }
    if (transaction.status !== 'CONFIRMED') {
      throw new Error('Solo se pueden reembolsar transacciones confirmadas.');
    }

    // 2. Calcular monto a reembolsar
    const montoReembolsar = amount || transaction.amount; // Si no se especifica, reembolsar todo
    if (montoReembolsar.greaterThan(transaction.amount)) {
      throw new Error('El monto a reembolsar no puede ser mayor al monto original.');
    }

    // 3. Crear entidad Refund en estado PENDING
    const refund = new Refund({
      id: UUIDVO.generate(),
      transactionId,
      amount: montoReembolsar,
      reason,
    });

    // 4. Llamar al gateway para procesar el reembolso
    const success = await this.paymentGateway.refundPaymentIntent(
      transaction.paymentIntentId!,
      montoReembolsar.toCents()
    );

    if (success) {
      refund.confirm(); // Cambiar estado a CONFIRMED
    } else {
      refund.fail(); // Cambiar estado a FAILED
    }

    // 5. Guardar el reembolso
    await this.refundRepo.save(refund);

    return refund;
  }
}