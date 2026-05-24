import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../infrastructure/telegram.service';

/**
 * HandoffNotifierService — alerta a operadores humanos cuando el AI
 * deriva una llamada telefónica a humano.
 *
 * Patrón:
 *   AI invoca tool `request_handoff_phone` → RealtimeBridgeService captura
 *   en el handler `tool.call` → llama a `notifier.notify({...})` → este
 *   service manda Telegram al operador de guardia con info contextual:
 *     - desde qué número llamó
 *     - prioridad (RED/ORANGE/NORMAL)
 *     - razón breve del escalamiento
 *     - últimos turnos del transcript (para que el operador entre en contexto)
 *     - si el cliente pidió callback (vs esperar en línea)
 *
 * El "handoff físico" (transferir la llamada Twilio al teléfono del operador)
 * es SEPARADO de la notificación y vive en TwiML <Dial> — si HANDOFF_OPERATOR_PHONE
 * está set, el bridge cierra la session OpenAI y devuelve TwiML <Dial>
 * para conectar la PSTN al operador. Si NO está set, modo "callback only":
 * el AI le dice "ya vino el equipo, te van a llamar pronto" y cuelga.
 *
 * Env:
 *   OPERATOR_TELEGRAM_CHAT_IDS — comma-separated chat IDs (mismo que
 *                                customer-support — operadores compartidos)
 *   HANDOFF_OPERATOR_PHONE      — E.164 opcional del operador on-call.
 *                                Si no set → modo callback-only.
 */
@Injectable()
export class HandoffNotifierService {
  private readonly logger = new Logger(HandoffNotifierService.name);

  constructor(
    private readonly config:   ConfigService,
    private readonly telegram: TelegramService,
  ) {}

  /** True si HANDOFF_OPERATOR_PHONE está configurado — significa que podemos
   *  hacer transferencia PSTN real (vs. solo callback async). */
  hasOperatorPhone(): boolean {
    return !!this.config.get<string>('HANDOFF_OPERATOR_PHONE');
  }

  /** E.164 del operador on-call. Empty string si no configurado. */
  operatorPhone(): string {
    return this.config.get<string>('HANDOFF_OPERATOR_PHONE') ?? '';
  }

  private operatorChatIds(): string[] {
    const raw = this.config.get<string>('OPERATOR_TELEGRAM_CHAT_IDS') ?? '';
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }

  /**
   * Alerta a los operadores. Best-effort: si Telegram falla, log warn y
   * sigue — NO bloquea el flow de la call (lo crítico es responderle
   * algo al cliente, no garantizar el ack del operador).
   */
  async notify(args: {
    callId:            string;
    from:              string;             // E.164 del que llama
    priority:          'RED' | 'ORANGE' | 'NORMAL';
    reason:            string;
    callbackRequested: boolean;
    transcript?:       Array<{ role: 'user' | 'assistant'; text: string }>;
  }): Promise<void> {
    const ids = this.operatorChatIds();
    if (ids.length === 0) {
      this.logger.warn(
        `[handoff] llamada ${args.callId} requiere handoff pero OPERATOR_TELEGRAM_CHAT_IDS está vacío`,
      );
      return;
    }

    const emoji =
      args.priority === 'RED'    ? '🔴' :
      args.priority === 'ORANGE' ? '🟠' :
                                   '🟡';
    const transferMode = this.hasOperatorPhone()
      ? `📞 Te transferimos automático en breve (${this.maskPhone(this.operatorPhone())})`
      : '📵 Modo callback — devolvele la llamada a este número';

    const lines: string[] = [
      `${emoji} *Llamada telefónica derivada* — prioridad: ${args.priority}`,
      `📲 Cliente: \`${args.from}\``,
      `🆔 CallId: \`${args.callId.slice(0, 16)}\``,
      `${args.callbackRequested ? '↩️ Cliente pidió que lo llamen de vuelta' : '⏳ Cliente esperando en línea'}`,
      transferMode,
      ``,
      `*Motivo:*`,
      `_${this.truncate(args.reason, 250)}_`,
    ];

    if (args.transcript?.length) {
      lines.push('', '*Conversación reciente:*');
      for (const t of args.transcript.slice(-5)) {
        const tag = t.role === 'user' ? '👤' : '🤖';
        lines.push(`${tag} ${this.truncate(t.text, 180)}`);
      }
    }

    const text = lines.join('\n');

    // Fire-and-forget — paralelo a todos los operadores configurados.
    await Promise.allSettled(
      ids.map((chatId) => this.telegram.sendMessage(chatId, text)),
    );

    this.logger.log(
      `[handoff] ${args.priority} notificado a ${ids.length} operadores callId=${args.callId.slice(0, 12)} from=${args.from}`,
    );
  }

  /** Enmascara el número del operador para no exponerlo en logs de Telegram. */
  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '***';
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }

  private truncate(s: string, max: number): string {
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
  }
}
