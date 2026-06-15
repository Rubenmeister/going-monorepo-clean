import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import {
  ParcelModelSchema,
  ParcelDocument,
} from '../persistence/schemas/parcel.schema';

/**
 * ParcelDelayAlertCron — avisa PROACTIVAMENTE a quien envía cuando un paquete
 * lleva demasiado tiempo en un estado activo (recogida o tránsito).
 *
 * Espeja el patrón de `scheduled-ride-reminder.cron` del transport-service.
 * El schema no guarda timestamps por-estado, así que usamos `updatedAt` como
 * proxy del "tiempo en el estado actual" (aproximado, suficiente para v1).
 * Idempotente vía `delayAlertSentAt` (un aviso por paquete).
 *
 * ⚠️ APAGADO POR DEFECTO. Envía notificaciones a clientes reales: encenderlo
 * (ENVIOS_DELAY_ALERTS_ENABLED=true) SOLO después de validar los umbrales con
 * datos reales, para no generar falsas alarmas.
 *
 * Env:
 *   ENVIOS_DELAY_ALERTS_ENABLED   default 'false'
 *   ENVIOS_PICKUP_DELAY_MIN       default 20  (min en pickup_assigned sin recoger)
 *   ENVIOS_TRANSIT_DELAY_MIN      default 60  (min en in_transit sin entregar)
 *   NOTIFICATIONS_SERVICE_URL + INTERNAL_SERVICE_TOKEN  (S2S best-effort)
 */
@Injectable()
export class ParcelDelayAlertCron {
  private readonly logger = new Logger(ParcelDelayAlertCron.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(ParcelModelSchema.name)
    private readonly parcelModel: Model<ParcelDocument>,
  ) {}

  private enabled(): boolean {
    return this.config.get<string>('ENVIOS_DELAY_ALERTS_ENABLED') === 'true';
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run(): Promise<void> {
    if (!this.enabled()) return;

    const now = Date.now();
    const pickupMin = Number(this.config.get('ENVIOS_PICKUP_DELAY_MIN') ?? 20);
    const transitMin = Number(this.config.get('ENVIOS_TRANSIT_DELAY_MIN') ?? 60);
    const pickupCut = new Date(now - pickupMin * 60_000);
    const transitCut = new Date(now - transitMin * 60_000);

    let due: any[] = [];
    try {
      due = await this.parcelModel
        .find({
          delayAlertSentAt: { $exists: false },
          $or: [
            { status: 'pickup_assigned', updatedAt: { $lt: pickupCut } },
            { status: 'in_transit', updatedAt: { $lt: transitCut } },
          ],
        })
        .limit(100)
        .lean()
        .exec();
    } catch (e) {
      this.logger.error(`[delay-alert] query falló: ${(e as Error).message}`);
      return;
    }

    if (!due.length) return;
    this.logger.log(`[delay-alert] ${due.length} envío(s) con retraso`);

    for (const p of due) {
      try {
        await this.notify(p);
        await this.parcelModel.updateOne(
          { id: p.id },
          { $set: { delayAlertSentAt: new Date() } },
        );
      } catch (e) {
        this.logger.warn(
          `[delay-alert] fallo en envío ${p.id}: ${(e as Error).message}`,
        );
      }
    }
  }

  /** Notifica al remitente vía notifications-service (best-effort). */
  private async notify(parcel: any): Promise<void> {
    const url = this.config.get<string>('NOTIFICATIONS_SERVICE_URL');
    const token = this.config.get<string>('INTERNAL_SERVICE_TOKEN');

    const body =
      parcel.status === 'in_transit'
        ? 'Tu envío está tardando un poco más de lo previsto. Sigue en camino — te avisamos al entregar.'
        : 'Estamos coordinando la recogida de tu envío; está tomando un poco más de lo normal. Seguimos en eso.';

    if (!url || !token) {
      // Sin S2S configurado: solo dejamos registro (no rompe el cron).
      this.logger.log(
        `[delay-alert] (sin notifications S2S) envío ${parcel.id} status=${parcel.status}`,
      );
      return;
    }

    await axios.post(
      `${url}/notifications/send`,
      {
        userId: parcel.userId,
        type: 'parcel_delay',
        title: 'Going App — tu envío',
        body,
        data: {
          parcelId: parcel.id,
          trackingCode: parcel.trackingCode,
          status: parcel.status,
        },
      },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 5000 },
    );
  }
}
