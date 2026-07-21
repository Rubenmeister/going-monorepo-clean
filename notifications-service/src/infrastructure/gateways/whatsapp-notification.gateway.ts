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

    const payload = this.construirPayload(props, to);

    try {
      const res = await fetch(`${META_GRAPH}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
   * Decide entre PLANTILLA y texto libre.
   *
   * Meta solo entrega texto libre dentro de la ventana de 24h desde el último
   * mensaje del usuario. Fuera de ella **acepta la petición (201) y no entrega
   * nada**: no hay error que detectar, el aviso simplemente no llega. Verificado
   * en producción — el primer intento no llegó, y tras escribirle "hola" al
   * número de negocio, el segundo sí.
   *
   * Con una plantilla aprobada por Meta el mensaje se entrega siempre. Por eso,
   * si hay plantilla configurada, se usa esa. La elección es por variable de
   * entorno: el día que exista la plantilla se activa sin tocar código ni
   * redesplegar nada más que la variable.
   */
  private construirPayload(props: any, to: string): Record<string, unknown> {
    const plantilla = this.resolverPlantilla(props);

    if (plantilla) {
      this.logger.log(`[WhatsApp] Enviando por plantilla "${plantilla.name}"`);
      return {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: plantilla.name,
          language: { code: plantilla.language },
          components: [
            {
              type: 'body',
              parameters: plantilla.params.map((text) => ({ type: 'text', text })),
            },
          ],
        },
      };
    }

    // Sin plantilla: texto libre. Se avisa en el log, porque este mensaje puede
    // no entregarse nunca y no habrá ningún error que lo delate.
    this.logger.warn(
      '[WhatsApp] Sin plantilla configurada — se envía texto libre, que Meta ' +
        'solo entrega dentro de la ventana de 24h. Si el aviso es importante, ' +
        'configura WHATSAPP_TEMPLATE_DEFAULT con una plantilla aprobada.',
    );
    return {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: this.formatMessage(props) },
    };
  }

  /**
   * Plantilla a usar, si hay.
   *
   * Prioridad: la que declare la notificación (`data.template`) → la de su tipo
   * (`WHATSAPP_TEMPLATE_<TIPO>`) → la general (`WHATSAPP_TEMPLATE_DEFAULT`).
   *
   * Los parámetros van en el orden en que Meta los espera en el cuerpo de la
   * plantilla. Por defecto: título y cuerpo del aviso. Una plantilla como
   * "{{1}}: {{2}}" cubre cualquier notificación sin crear una por evento.
   */
  private resolverPlantilla(
    props: any,
  ): { name: string; language: string; params: string[] } | null {
    const declarada = props.data?.template;
    const tipo = String(props.type ?? props.data?.tipo ?? '').toUpperCase();

    const name =
      (typeof declarada === 'string' ? declarada : declarada?.name) ||
      (tipo ? this.config.get<string>(`WHATSAPP_TEMPLATE_${tipo}`) : undefined) ||
      this.config.get<string>('WHATSAPP_TEMPLATE_DEFAULT');

    if (!name) return null;

    const language =
      declarada?.language ||
      this.config.get<string>('WHATSAPP_TEMPLATE_LANG') ||
      'es';

    // Parámetros explícitos si la notificación los trae; si no, título + cuerpo.
    const params: string[] = Array.isArray(declarada?.params)
      ? declarada.params.map((p: unknown) => String(p ?? ''))
      : [String(props.title ?? 'Aviso de Going'), String(props.body ?? '')];

    // Meta rechaza parámetros vacíos o con saltos de línea.
    return {
      name,
      language,
      params: params.map((p) => (p.trim() || '—').replace(/\s*\n+\s*/g, ' ').slice(0, 900)),
    };
  }

  /** Mensaje de texto libre: título en negrita + cuerpo + enlace opcional. */
  private formatMessage(props: any): string {
    const titulo = props.title ? `*${props.title}*\n` : '';
    const cuerpo = props.body ?? '';
    const url = props.data?.url ? `\n\n${props.data.url}` : '';
    return `${titulo}${cuerpo}${url}`.slice(0, 4000);
  }
}
