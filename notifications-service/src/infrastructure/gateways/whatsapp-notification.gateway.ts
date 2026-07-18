import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Result, ok, err } from 'neverthrow';
import {
  Notification,
  INotificationGateway,
} from '@going-monorepo-clean/domains-notification-core';

const META_GRAPH = 'https://graph.facebook.com/v19.0';

/**
 * WhatsApp Notification Gateway — Meta Cloud API.
 *
 * WhatsApp es EL canal en Ecuador, y la integración ya está viva en
 * customer-support-service (mismo número de negocio). Este gateway la expone
 * como canal de notificaciones para los avisos corporativos: viaje confirmado,
 * aprobación pendiente, factura vencida, etc.
 *
 * Env: WHATSAPP_PHONE_NUMBER_ID · META_WA_ACCESS_TOKEN
 *
 * DESTINATARIO: sale de `data.phone` (o `data.to`) de la notificación — quien
 * la emite sabe a quién avisar (el aprobador, el financiero, el pasajero).
 *
 * A diferencia del gateway de SMS —que resuelve el teléfono con un mock que
 * devuelve null y por eso NUNCA envía nada, fingiendo éxito— aquí la falta de
 * número o de credenciales devuelve error: un aviso que no salió debe verse.
 */
@Injectable()
export class WhatsAppNotificationGateway implements INotificationGateway {
  private readonly logger = new Logger(WhatsAppNotificationGateway.name);

  constructor(private readonly config: ConfigService) {}

  private get phoneNumberId(): string {
    return this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') ?? '';
  }

  private get accessToken(): string {
    return this.config.get<string>('META_WA_ACCESS_TOKEN') ?? '';
  }

  /** Normaliza a E.164 sin '+' (lo que espera la Graph API). */
  private normalizePhone(raw: string): string | null {
    const digits = String(raw ?? '').replace(/[^\d]/g, '');
    if (digits.length < 8) return null;
    // 09XXXXXXXX (Ecuador local) → 5939XXXXXXXX
    if (digits.startsWith('0') && digits.length === 10) return '593' + digits.slice(1);
    return digits;
  }

  async send(notification: Notification): Promise<Result<void, Error>> {
    const props: any = notification.toPrimitives();
    const data = props.data ?? {};

    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.error(
        '[WhatsApp] Falta WHATSAPP_PHONE_NUMBER_ID o META_WA_ACCESS_TOKEN — no se envía',
      );
      return err(new Error('WhatsApp no configurado'));
    }

    const to = this.normalizePhone(data.phone ?? data.to ?? '');
    if (!to) {
      this.logger.warn(
        `[WhatsApp] Notificación sin teléfono destino (userId=${props.userId}) — no se envía`,
      );
      return err(new Error('Notificación sin teléfono destino'));
    }

    const cuerpo = this.formatMessage(props);

    try {
      const res = await fetch(`${META_GRAPH}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: cuerpo },
        }),
      });

      if (!res.ok) {
        const detalle = await res.text().catch(() => '');
        this.logger.error(`[WhatsApp] Envío falló ${res.status}: ${detalle.slice(0, 300)}`);
        return err(new Error(`WhatsApp ${res.status}`));
      }

      this.logger.log(`[WhatsApp] Enviado a ${to.slice(0, 6)}*** (${props.title ?? ''})`);
      return ok(undefined);
    } catch (e: any) {
      this.logger.error(`[WhatsApp] Error de red: ${e?.message}`);
      return err(new Error(`WhatsApp: ${e?.message}`));
    }
  }

  /**
   * Mensaje listo para WhatsApp: título en negrita + cuerpo + enlace opcional.
   * Sin plantillas de Meta todavía, así que solo funciona dentro de la ventana
   * de 24h o con conversaciones iniciadas por el usuario.
   */
  private formatMessage(props: any): string {
    const titulo = props.title ? `*${props.title}*\n` : '';
    const cuerpo = props.body ?? '';
    const url = props.data?.url ? `\n\n${props.data.url}` : '';
    return `${titulo}${cuerpo}${url}`.slice(0, 4000);
  }
}
