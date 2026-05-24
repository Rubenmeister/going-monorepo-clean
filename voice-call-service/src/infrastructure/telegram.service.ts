import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente mínimo de Telegram Bot API.
 *
 * Solo expone `sendMessage` — es lo único que necesita el HandoffNotifier
 * para alertar al operador de guardia cuando el AI deriva una llamada
 * telefónica a humano.
 *
 * NOTA: copia liviana del TelegramService de customer-support-service.
 * Si crecen los use cases (sendVoice / sendPhoto / etc.) considerar mover
 * a libs/telegram-client/ como lib compartida.
 *
 * Env requeridas:
 *   TELEGRAM_BOT_TOKEN — formato '123456789:AAGqPxxxx...'
 *   (el chat ID del operador se pasa por argumento — vive en
 *    OPERATOR_TELEGRAM_CHAT_IDS gestionado por HandoffNotifierService)
 */
const TELEGRAM_API = 'https://api.telegram.org';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  private get token(): string {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
  }

  /** Envía mensaje de texto. Markdown habilitado para formato (negritas, code). */
  async sendMessage(chatId: number | string, text: string): Promise<boolean> {
    if (!this.token) {
      this.logger.error('[telegram] TELEGRAM_BOT_TOKEN not configured');
      return false;
    }

    try {
      const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:    chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        this.logger.error(`[telegram] sendMessage ${res.status}: ${err.slice(0, 200)}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`[telegram] sendMessage threw: ${(err as Error).message}`);
      return false;
    }
  }
}
