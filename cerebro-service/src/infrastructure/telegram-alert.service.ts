import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente HTTP minimalista para enviar alertas via Telegram Bot API.
 *
 * Diseño:
 *   - Best-effort: si falla el envío, log y seguir. Nunca rompe el cron.
 *   - Sin SDK (fetch + form-data) — la API de Telegram es simple.
 *   - Soporta múltiples chat IDs (comma-separated en TELEGRAM_CHAT_ID o
 *     CEREBRO_ALERT_CHAT_IDS si se quiere distinguir del chat ops normal).
 *
 * El alert chat ID se reutiliza del TELEGRAM_CHAT_ID — todo va al mismo
 * canal de operaciones de Going. Si en el futuro queremos un canal separado
 * para alerts de meta-infra (vs alerts de negocio), agregar CEREBRO_ALERT_CHAT_IDS.
 */
@Injectable()
export class TelegramAlertService {
  private readonly logger = new Logger(TelegramAlertService.name);

  constructor(private readonly config: ConfigService) {}

  private get botToken(): string | null {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN') || null;
  }

  private get chatIds(): string[] {
    // Preferí CEREBRO_ALERT_CHAT_IDS si está, sino TELEGRAM_CHAT_ID.
    const raw =
      this.config.get<string>('CEREBRO_ALERT_CHAT_IDS') ||
      this.config.get<string>('TELEGRAM_CHAT_ID') ||
      '';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Envía un mensaje a los chat IDs configurados. Devuelve true si todos
   * los envíos fueron exitosos (best-effort, no throw).
   */
  async send(message: string): Promise<boolean> {
    const token = this.botToken;
    const ids   = this.chatIds;

    if (!token) {
      this.logger.debug('TELEGRAM_BOT_TOKEN no configurado — saltando envío');
      return false;
    }
    if (ids.length === 0) {
      this.logger.debug('Sin chat IDs configurados — saltando envío');
      return false;
    }

    // Telegram máx 4096 chars por mensaje. Truncamos con margen.
    const body = message.length > 3800 ? message.slice(0, 3800) + '\n\n…(truncado)' : message;

    let allOk = true;
    for (const chatId of ids) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: body,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(15_000),
        });
        const data = (await res.json()) as { ok: boolean; description?: string };
        if (!data.ok) {
          this.logger.warn(`Telegram error chat=${chatId}: ${data.description}`);
          allOk = false;
        }
      } catch (e) {
        this.logger.warn(`Telegram exception chat=${chatId}: ${(e as Error).message}`);
        allOk = false;
      }
    }
    return allOk;
  }
}
