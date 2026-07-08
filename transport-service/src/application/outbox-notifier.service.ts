import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotificationOutboxModel,
  NotificationOutboxDocument,
} from '../infrastructure/persistence/schemas/notification-outbox.schema';

export interface OutboxNotification {
  userId: string;
  type?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/**
 * OutboxNotifier — entrega notificaciones importantes con GARANTÍA de reintento
 * (auditoría #16). enqueue() persiste + intenta de una; el barrido reintenta las
 * pendientes con backoff exponencial y, tras MAX_ATTEMPTS, las marca 'dead'
 * (dead-letter). Sobrevive a caídas del pod (a diferencia del fire-and-forget).
 */
@Injectable()
export class OutboxNotifier {
  private readonly logger = new Logger(OutboxNotifier.name);
  private static readonly MAX_ATTEMPTS = 6;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(NotificationOutboxModel.name)
    private readonly outbox: Model<NotificationOutboxDocument>,
  ) {}

  /** Encola la notificación y dispara un primer intento inmediato (no bloquea). */
  async enqueue(n: OutboxNotification): Promise<void> {
    if (!n.userId) return;
    try {
      const doc = await this.outbox.create({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data ?? {},
        status: 'pending',
        attempts: 0,
        nextAttemptAt: new Date(),
      });
      void this.trySend(doc._id as Types.ObjectId);
    } catch (e) {
      this.logger.error(`[outbox] enqueue falló user=${n.userId}: ${(e as Error).message}`);
    }
  }

  private backoffMs(attempts: number): number {
    // 30s, 1m, 2m, 4m, 8m … con tope de 15 min.
    return Math.min(15 * 60_000, 30_000 * 2 ** (attempts - 1));
  }

  /** Intenta entregar una entrada; actualiza estado/backoff/dead-letter. */
  private async trySend(id: Types.ObjectId): Promise<void> {
    let doc: NotificationOutboxDocument | null;
    try {
      doc = await this.outbox.findById(id);
    } catch {
      return;
    }
    if (!doc || doc.status !== 'pending') return;

    const ok = await this.deliver(doc);
    if (ok) {
      doc.status = 'sent';
      await doc.save().catch(() => undefined);
      return;
    }
    doc.attempts += 1;
    if (doc.attempts >= OutboxNotifier.MAX_ATTEMPTS) {
      doc.status = 'dead';
      this.logger.error(
        `[outbox] DEAD-LETTER user=${doc.userId} type=${doc.type} tras ${doc.attempts} intentos`,
      );
    } else {
      doc.nextAttemptAt = new Date(Date.now() + this.backoffMs(doc.attempts));
    }
    await doc.save().catch(() => undefined);
  }

  /** POST real al notifications-service. true solo si res.ok. */
  private async deliver(doc: NotificationOutboxDocument): Promise<boolean> {
    const url = (this.config.get<string>('NOTIFICATIONS_SERVICE_URL') || 'http://localhost:3008').replace(/\/$/, '');
    const token = this.config.get<string>('INTERNAL_SERVICE_TOKEN');
    if (!token) {
      doc.lastError = 'INTERNAL_SERVICE_TOKEN ausente';
      return false;
    }
    try {
      const res = await fetch(`${url}/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          userId: doc.userId,
          type: doc.type,
          title: doc.title,
          body: doc.body,
          data: doc.data ?? {},
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) {
        doc.lastError = `HTTP ${res.status}`;
        return false;
      }
      return true;
    } catch (e) {
      doc.lastError = (e as Error).message;
      return false;
    }
  }

  /** Barrido: reintenta las pendientes cuyo nextAttemptAt ya llegó. */
  @Cron(CronExpression.EVERY_MINUTE, { name: 'outbox-sweep' })
  async sweep(): Promise<void> {
    let due: NotificationOutboxDocument[];
    try {
      due = await this.outbox
        .find({ status: 'pending', nextAttemptAt: { $lte: new Date() } })
        .sort({ nextAttemptAt: 1 })
        .limit(100)
        .exec();
    } catch (e) {
      this.logger.error(`[outbox] sweep query falló: ${(e as Error).message}`);
      return;
    }
    if (!due.length) return;
    for (const doc of due) {
      await this.trySend(doc._id as Types.ObjectId);
    }
  }
}
