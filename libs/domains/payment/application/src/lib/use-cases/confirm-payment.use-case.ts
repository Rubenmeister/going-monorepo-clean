import { IPaymentRepository } from '../ports/itransaction.repository';
import { IPaymentGateway } from '../ports/ipayment.gateway';
import { Transaction } from '../entities/transaction.entity';

interface ConfirmPaymentCommand {
  transactionId: string;
}

export class ConfirmPaymentUseCase {
  constructor(
    private paymentRepo: IPaymentRepository,
    private paymentGateway: IPaymentGateway,
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<boolean> {
    const transaction = await this.paymentRepo.findById(command.transactionId);

    if (!transaction) {
      throw new Error('Transacción no encontrada.');
    }

    if (transaction.status !== 'PENDING') {
      throw new Error('Solo transacciones pendientes pueden confirmarse.');
    }

    const success = await this.paymentGateway.confirmPaymentIntent(transaction.paymentIntentId!);

    if (success) {
      transaction.confirm(transaction.paymentIntentId!); // Ya está confirmado, pero por si acaso
      await this.paymentRepo.update(transaction);
      return true;
    } else {
      transaction.fail();
      await this.paymentRepo.update(transaction);
      return false;
    }
  }
}