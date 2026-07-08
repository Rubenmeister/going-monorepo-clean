import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DriverPushTokenModelSchema,
  DriverPushTokenDocument,
} from '../persistence/schemas/driver-push-token.schema';

interface ExpoPushPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  channelId?: string;
}

/**
 * ExpoPushService — envía notificaciones push via Expo Push API.
 *
 * Por qué Expo Push API y no FCM Admin SDK directo:
 *   - No requiere Firebase service account JSON ni configuración de credenciales
 *   - Expo maneja iOS (APNs) y Android (FCM) detrás. Un solo POST sin keys.
 *   - Si el token es Expo Push Token, esto funciona; tokens FCM nativos no
 *     son aceptados por exp.host pero el cliente Expo siempre devuelve token Expo.
 *
 * Endpoint: POST https://exp.host/--/api/v2/push/send
 *   Body: { to, title, body, data, channelId, sound, priority }
 *   Auth: ninguna (Expo identifica al projectId via el token)
 *   Rate limit: 100 mensajes por request en batch (no usamos por simplicidad)
 *
 * Failures: best-effort. Si Expo está caído, los logs quedan en Cloud Logging
 * y el conductor sigue recibiendo el viaje vía polling de /rides/pending.
 */
@Injectable()
export class ExpoPushService {
  private readonly logger = new Logger(ExpoPushService.name);
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

  constructor(
    @InjectModel(DriverPushTokenModelSchema.name)
    private readonly tokenModel: Model<DriverPushTokenDocument>,
  ) {}

  /**
   * Envía push notification al driver. Lookup del token, llamada HTTP, log.
   * Nunca lanza — los errores se logean. Idempotente: enviar 2 pushes idénticos
   * solo da 2 notificaciones, no rompe nada.
   */
  async sendToDriver(driverId: string, payload: ExpoPushPayload): Promise<void> {
    const tokenDoc = await this.tokenModel.findOne({ driverId }).lean();
    if (!tokenDoc) {
      this.logger.debug(
        `No push token for driver ${driverId} — push silently skipped`,
      );
      return;
    }

    try {
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: 'POST',
        // Timeout: sin esto, un Expo degradado colgaba el envío indefinidamente (#28).
        signal: AbortSignal.timeout(5000),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify({
          to: tokenDoc.expoPushToken,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          sound: 'default',
          priority: 'high',
          channelId: payload.channelId ?? 'ride-requests',
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        this.logger.warn(
          `Expo Push to driver ${driverId} returned ${response.status}: ${text}`,
        );
        return;
      }

      // Expo retorna {"data":{"id":"...","status":"ok"}} en caso normal.
      // Si status:'error' indica token inválido, etc — logeamos pero no
      // borramos el token aún (puede ser transient).
      const json = (await response.json().catch(() => null)) as any;
      const status = json?.data?.status;
      if (status && status !== 'ok') {
        this.logger.warn(
          `Expo Push reported non-ok for driver ${driverId}: ${JSON.stringify(json?.data)}`,
        );
      }
    } catch (e: any) {
      this.logger.warn(
        `Expo Push failed for driver ${driverId}: ${e?.message ?? String(e)}`,
      );
    }
  }

  /**
   * Bulk send — útil cuando matchamos varios drivers para un mismo viaje.
   * Lo hacemos en paralelo (Promise.allSettled) para no bloquear si uno falla.
   */
  async sendToDrivers(
    driverIds: string[],
    payload: ExpoPushPayload,
  ): Promise<void> {
    await Promise.allSettled(
      driverIds.map((id) => this.sendToDriver(id, payload)),
    );
  }
}
