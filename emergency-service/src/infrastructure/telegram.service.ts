import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente mínimo de Telegram Bot API — solo lo necesario para mandar
 * alertas SOS a los operadores. Stateless, sin webhook handling
 * (este servicio NO recibe mensajes de Telegram — los recibe customer-support).
 *
 * Reusable: idéntico al de customer-support-service. Si en el futuro
 * estandarizamos, mover a `libs/notifications/telegram-client`.
 */
const TELEGRAM_API = 'https://api.telegram.org';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  private get token(): string {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
  }

  /** Envía texto en formato Markdown. Devuelve true/false (idempotente). */
  async sendMessage(chatId: number | string, text: string): Promise<boolean> {
    if (!this.token) {
      this.logger.error('TELEGRAM_BOT_TOKEN not configured');
      return false;
    }
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: false, // Queremos el preview de Google Maps
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`Telegram sendMessage failed: ${res.status} ${err}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`Telegram sendMessage error: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Envía ubicación nativa de Telegram. Mejor UX que un link de Google Maps —
   * el cliente abre el mapa in-app con un tap.
   */
  async sendLocation(chatId: number | string, lat: number, lng: number): Promise<boolean> {
    if (!this.token) return false;
    try {
      const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendLocation`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id:   chatId,
          latitude:  lat,
          longitude: lng,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        this.logger.warn(`Telegram sendLocation failed: ${res.status} ${err}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.warn(`Telegram sendLocation error: ${(err as Error).message}`);
      return false;
    }
  }
}
