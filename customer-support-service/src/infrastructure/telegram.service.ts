import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Cliente mínimo de Telegram Bot API.
 *
 * Endpoints docs: https://core.telegram.org/bots/api
 *
 * Necesita TELEGRAM_BOT_TOKEN en env (formato `123456789:AAGqPxxxx...`).
 * Tras deploy, registrar el webhook con:
 *   curl "https://api.telegram.org/bot${TOKEN}/setWebhook?url=https://customer-support-service-...run.app/telegram/webhook"
 */
const TELEGRAM_API = 'https://api.telegram.org';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(private readonly config: ConfigService) {}

  private get token(): string {
    return this.config.get<string>('TELEGRAM_BOT_TOKEN') ?? '';
  }

  /** Envía un mensaje de texto plano. */
  async sendMessage(chatId: number | string, text: string): Promise<boolean> {
    if (!this.token) {
      this.logger.error('TELEGRAM_BOT_TOKEN not configured');
      return false;
    }

    const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Telegram sendMessage failed: ${res.status} ${err}`);
      return false;
    }
    return true;
  }

  /** Envía un voice note (OGG_OPUS) usando multipart upload. */
  async sendVoice(chatId: number | string, audioBuffer: Buffer): Promise<boolean> {
    if (!this.token) return false;

    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append(
      'voice',
      new Blob([audioBuffer], { type: 'audio/ogg' }),
      'reply.ogg',
    );

    const res = await fetch(`${TELEGRAM_API}/bot${this.token}/sendVoice`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Telegram sendVoice failed: ${res.status} ${err}`);
      return false;
    }
    return true;
  }

  /**
   * Descarga un file_id de Telegram. Dos pasos:
   *   1. getFile?file_id=X   → devuelve { file_path }
   *   2. /file/bot{TOKEN}/{file_path}  → bytes
   */
  async downloadFile(fileId: string): Promise<Buffer | null> {
    if (!this.token) return null;
    try {
      const metaRes = await fetch(
        `${TELEGRAM_API}/bot${this.token}/getFile?file_id=${encodeURIComponent(fileId)}`,
      );
      if (!metaRes.ok) {
        this.logger.error(`Telegram getFile failed: ${metaRes.status}`);
        return null;
      }
      const meta = (await metaRes.json()) as { ok: boolean; result?: { file_path?: string } };
      const filePath = meta?.result?.file_path;
      if (!filePath) return null;

      const fileRes = await fetch(`${TELEGRAM_API}/file/bot${this.token}/${filePath}`);
      if (!fileRes.ok) {
        this.logger.error(`Telegram file download failed: ${fileRes.status}`);
        return null;
      }
      return Buffer.from(await fileRes.arrayBuffer());
    } catch (err) {
      this.logger.error('Telegram downloadFile error', err);
      return null;
    }
  }

  /** "Bot está escribiendo…" — buen UX mientras se procesa la respuesta. */
  async sendChatAction(chatId: number | string, action: 'typing' | 'record_voice' | 'upload_voice'): Promise<void> {
    if (!this.token) return;
    await fetch(`${TELEGRAM_API}/bot${this.token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    }).catch(() => {/* fire-and-forget; silent */});
  }
}
