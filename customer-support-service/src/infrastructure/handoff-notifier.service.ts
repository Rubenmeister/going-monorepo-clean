import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from './telegram.service';

/**
 * Cuando un cliente pide hablar con un humano (o el bot detecta una
 * emergencia / cliente frustrado), notifica a todos los operadores
 * registrados via Telegram. Configurable con env OPERATOR_TELEGRAM_CHAT_IDS
 * (comma-separated chat IDs).
 *
 * El operador puede obtener su chat ID enviando /chat-id al bot.
 */
@Injectable()
export class HandoffNotifierService {
  private readonly logger = new Logger(HandoffNotifierService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  private operatorIds(): string[] {
    const raw = this.config.get<string>('OPERATOR_TELEGRAM_CHAT_IDS') ?? '';
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  async notify(args: {
    userId:        string;                          // 'tg:12345' o número WA
    channel:       'whatsapp' | 'telegram' | 'web';
    priority:      'RED' | 'ORANGE' | 'NORMAL';
    reason:        string;
    lastMessages?: { role: string; content: string }[];
  }): Promise<void> {
    const ids = this.operatorIds();
    if (ids.length === 0) {
      this.logger.warn('Handoff requested pero no hay operadores en OPERATOR_TELEGRAM_CHAT_IDS');
      return;
    }

    const emoji = args.priority === 'RED'    ? '🔴'
                : args.priority === 'ORANGE' ? '🟠'
                :                              '🟡';
    const channelLabel = args.channel === 'whatsapp' ? '📱 WhatsApp'
                       : args.channel === 'telegram' ? '✈️ Telegram'
                       :                                '🌐 Web';
    const userIdClean = args.userId.startsWith('tg:') ? args.userId.slice(3) : args.userId;

    const lines: string[] = [
      `${emoji} *Atención humana requerida* — prioridad: ${args.priority}`,
      `${channelLabel}`,
      `Cliente: \`${userIdClean}\``,
      ``,
      `Mensaje que disparó el escalamiento:`,
      `_${this.truncate(args.reason, 250)}_`,
    ];

    if (args.lastMessages?.length) {
      lines.push('', '*Conversación reciente:*');
      for (const m of args.lastMessages.slice(-5)) {
        const tag = m.role === 'user' ? '👤' : '🤖';
        lines.push(`${tag} ${this.truncate(m.content, 180)}`);
      }
    }

    if (args.channel === 'whatsapp') {
      lines.push('', `Para responderle: POST /whatsapp/operator-message con userId \`${userIdClean}\``);
    }

    const text = lines.join('\n');

    // Fire-and-forget al lote de operadores
    await Promise.allSettled(
      ids.map(chatId => this.telegramService.sendMessage(chatId, text)),
    );

    this.logger.log(`Handoff notification sent to ${ids.length} operators (${args.priority}, ${args.channel})`);
  }

  private truncate(s: string, max: number): string {
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
  }
}
