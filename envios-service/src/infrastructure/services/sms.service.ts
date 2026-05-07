import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SmsService — envío de SMS via Twilio para casos C (receptor paga con card).
 *
 * Cuando un sender crea un envío con payerRole=recipient + paymentMethod=card,
 * tras matchear driver el sistema envía un SMS al receptor con un link a la
 * página de pago (paymentUrl del intent). El receptor abre el link, paga con
 * tarjeta vía Datafast widget, webhook actualiza parcel, driver puede entregar.
 *
 * Configuración:
 *   TWILIO_ACCOUNT_SID    — del account dashboard de Twilio
 *   TWILIO_AUTH_TOKEN     — Secret Manager
 *   TWILIO_FROM_NUMBER    — número aprobado para Ecuador (+593...)
 *
 * Si las credenciales faltan, log y no-op. La app sigue funcionando — el
 * receptor no recibe SMS pero el driver puede llamarlo manual con el phone.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid: string | undefined;
  private readonly authToken: string | undefined;
  private readonly fromNumber: string | undefined;

  constructor(private readonly config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');
  }

  private isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.fromNumber);
  }

  /**
   * Envía link de pago al receptor (caso C).
   * Usa Twilio REST API directamente para evitar el SDK pesado.
   */
  async sendPaymentLink(args: {
    toPhone: string;
    recipientName?: string;
    amountUsd: number;
    paymentLinkUrl: string;
    senderName?: string;
  }): Promise<void> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `SMS skipped (Twilio not configured) — would have sent payment link to ${args.toPhone}`,
      );
      return;
    }

    const greeting = args.recipientName ? `Hola ${args.recipientName}, ` : '';
    const senderClause = args.senderName ? `${args.senderName} te envió un paquete` : 'Tienes un envío en camino';
    const body =
      `${greeting}${senderClause} con Going. ` +
      `Valor a pagar: $${args.amountUsd.toFixed(2)}. ` +
      `Paga con tarjeta: ${args.paymentLinkUrl}`;

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({
        From: this.fromNumber!,
        To: this.normalizePhone(args.toPhone),
        Body: body,
      });

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        },
      );

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        this.logger.warn(`Twilio SMS failed (${response.status}): ${text}`);
        return;
      }
      this.logger.log(`Payment link SMS sent to ${args.toPhone}`);
    } catch (e: any) {
      this.logger.warn(`SMS send error: ${e?.message ?? String(e)}`);
    }
  }

  /**
   * Normaliza al formato E.164 que Twilio requiere.
   * Acepta entradas comunes en Ecuador (+593..., 593..., 09..., etc).
   */
  private normalizePhone(phone: string): string {
    const trimmed = phone.replace(/\s|-/g, '');
    if (trimmed.startsWith('+')) return trimmed;
    if (trimmed.startsWith('593')) return `+${trimmed}`;
    if (trimmed.startsWith('09')) return `+593${trimmed.slice(1)}`;
    if (trimmed.startsWith('9') && trimmed.length === 9) return `+593${trimmed}`;
    return trimmed; // fallback — Twilio rechazará si es inválido
  }
}
