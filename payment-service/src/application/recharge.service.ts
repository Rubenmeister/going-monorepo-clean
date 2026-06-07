import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Money } from '@going-monorepo-clean/shared-domain';
import { DatafastGateway } from '../infrastructure/gateways/datafast.gateway';
import { DeunaGateway } from '../infrastructure/gateways/deuna.gateway';
import { IPaymentRepository } from '../domain/ports';
import { WalletService } from './wallet.service';

type RechargeMethod = 'datafast' | 'deuna';

/**
 * Recarga del wallet del pasajero.
 *
 * Flujo robusto y money-safe:
 *  1. create(): crea un registro de pago `pending` (tripId = ref = nuestra
 *     referencia) y un intent en el gateway con esa MISMA referencia
 *     (merchantTransactionId/orderId). Devuelve el checkout al frontend.
 *  2. confirm(): consulta getPaymentStatus y, si está aprobado, acredita el
 *     wallet de forma IDEMPOTENTE (ref) y marca el pago completado.
 *  3. El webhook (WebhookController) hace lo mismo como backstop — ambos usan
 *     `ref`, así que nunca se acredita dos veces.
 */
@Injectable()
export class RechargeService {
  private readonly logger = new Logger(RechargeService.name);

  constructor(
    private readonly datafast: DatafastGateway,
    private readonly deuna: DeunaGateway,
    @Inject(IPaymentRepository) private readonly payments: IPaymentRepository,
    private readonly wallet: WalletService,
  ) {}

  async create(userId: string, amount: number, method: RechargeMethod) {
    if (!(amount >= 1)) throw new BadRequestException('El monto mínimo de recarga es $1.00');
    if (method !== 'datafast' && method !== 'deuna') {
      throw new BadRequestException('method debe ser "datafast" o "deuna"');
    }

    const ref = `rch_${randomUUID()}`;
    const money = Money.fromPrimitives({ amount: Math.round(amount * 100), currency: 'USD' });
    const gateway = method === 'datafast' ? this.datafast : this.deuna;

    const res = await gateway.createPaymentIntent(money, { reference: ref });
    if (res.isErr()) {
      const msg = res.error.message;
      throw new BadRequestException(
        msg.toLowerCase().includes('no configurado')
          ? `${method.toUpperCase()} no está disponible en este momento. Intenta más tarde.`
          : msg,
      );
    }
    const intent = res.value;

    await this.payments.create({
      id: ref,                 // → paymentId en el repo
      tripId: ref,             // correlación con confirm()/webhook
      passengerId: userId,
      driverId: 'wallet',
      amount,
      currency: 'USD',
      paymentMethod: 'card',   // pago externo que fondea el wallet
      status: 'pending',
      transactionId: intent.paymentIntentId, // checkoutId(datafast)/orderId(deuna)
      metadata: { type: 'wallet_recharge', userId, method },
    });

    this.logger.log(`Recarga creada ref=${ref} userId=${userId} amount=${amount} ${method}`);

    return {
      ref,
      method,
      amount,
      checkoutId: intent.paymentIntentId,
      checkoutUrl: method === 'datafast' ? intent.clientSecret : undefined,
      paymentLink: method === 'deuna' ? intent.clientSecret : undefined,
    };
  }

  async confirm(userId: string, ref: string) {
    const payment = await this.payments.findByTrip(ref);
    if (!payment) throw new BadRequestException('Recarga no encontrada');

    const meta = this.readMeta(payment);
    if (meta.type !== 'wallet_recharge' || payment.passengerId !== userId) {
      throw new BadRequestException('Recarga no válida');
    }

    if (payment.status === 'completed') {
      const { balance } = await this.wallet.getBalance(userId);
      return { status: 'completed' as const, balance };
    }

    const method: RechargeMethod = (meta.method as RechargeMethod) || 'datafast';
    const gateway = method === 'datafast' ? this.datafast : this.deuna;
    const statusRes = await gateway.getPaymentStatus(payment.transactionId);
    if (statusRes.isErr()) return { status: 'pending' as const };

    const s = statusRes.value;
    if (s === 'approved' || s === 'paid') {
      const { balance } = await this.wallet.credit(userId, payment.amount, 'Recarga de wallet', ref);
      await this.payments.update(payment.id, { status: 'completed', completedAt: new Date() });
      return { status: 'completed' as const, balance };
    }

    if (s.startsWith('rejected') || s === 'expired' || s === 'cancelled') {
      await this.payments.update(payment.id, { status: 'failed', failureReason: s });
      return { status: 'failed' as const };
    }

    return { status: 'pending' as const };
  }

  private readMeta(payment: any): Record<string, any> {
    const m = payment?.metadata;
    if (!m) return {};
    if (m instanceof Map) return Object.fromEntries(m);
    return m;
  }
}
