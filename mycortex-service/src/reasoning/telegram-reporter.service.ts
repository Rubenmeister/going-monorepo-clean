import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntentionInput } from './intentions-parser.service';
import { WorldSnapshot } from './world-snapshot.client';

/**
 * Envía las intenciones top de cada ciclo al chat Telegram de operaciones.
 *
 * Filosofía Fase 4 v0: el ops humano lee las propuestas y decide. MyCortex
 * NO ejecuta. El propósito de este servicio es darle a Ruben/ops un canal
 * de "qué razonó MyCortex hoy, qué creo que deberíamos hacer".
 */
@Injectable()
export class TelegramReporterService {
  private readonly logger = new Logger(TelegramReporterService.name);

  constructor(private readonly config: ConfigService) {}

  async report(args: {
    cycleId:    string;
    snapshot:   WorldSnapshot;
    intentions: IntentionInput[];
    reasoning:  string;
    model:      string;
    tokensIn:   number;
    tokensOut:  number;
  }): Promise<boolean> {
    const token  = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');

    if (!token || !chatId) {
      this.logger.warn('TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID no configurados — saltando report');
      return false;
    }

    const text = this.formatMessage(args);

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text:    text.slice(0, 3800),  // Telegram cap es 4096; margen para seguro
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      const data = await res.json() as { ok: boolean; description?: string };
      if (!data.ok) {
        this.logger.error(`Telegram error: ${data.description}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(`Excepción enviando Telegram: ${(err as Error).message}`);
      return false;
    }
  }

  private formatMessage(args: {
    cycleId:    string;
    snapshot:   WorldSnapshot;
    intentions: IntentionInput[];
    reasoning:  string;
    model:      string;
    tokensIn:   number;
    tokensOut:  number;
  }): string {
    const { snapshot, intentions, reasoning, model, tokensIn, tokensOut } = args;
    const healthEmoji = snapshot.systemHealth === 'critical' ? '🚨'
                      : snapshot.systemHealth === 'degraded' ? '⚠️'
                      :                                        '✅';

    const time = new Date().toLocaleString('es-EC', {
      timeZone: 'America/Guayaquil',
      hour:    '2-digit',
      minute:  '2-digit',
      day:     '2-digit',
      month:   '2-digit',
    });

    const lines: string[] = [
      `🧠 <b>MyCortex — ciclo ${time}</b>`,
      `World health: ${healthEmoji} ${snapshot.systemHealth}`,
      `Críticas: ${snapshot.totalCriticalAnomalies} | Warnings: ${snapshot.totalWarnings}`,
      `Modelo: ${model} | tokens in/out: ${tokensIn}/${tokensOut}`,
      ``,
    ];

    if (intentions.length === 0) {
      lines.push(`Sin intenciones nuevas. Sistema estable. 🟢`);
      if (reasoning) {
        lines.push(``, `<i>Razonamiento:</i> ${this.truncate(reasoning, 400)}`);
      }
      return lines.join('\n');
    }

    lines.push(`<b>Top ${Math.min(intentions.length, 5)} intenciones:</b>`, '');

    for (const [i, intent] of intentions.slice(0, 5).entries()) {
      const urgencyEmoji = intent.urgency >= 0.8 ? '🔴'
                         : intent.urgency >= 0.5 ? '🟠'
                         :                         '🟡';
      lines.push(
        `<b>${i + 1}. ${urgencyEmoji} ${intent.type}</b> (urgency ${intent.urgency.toFixed(2)})`,
      );
      if (intent.target) lines.push(`   Target: <code>${intent.target}</code>`);
      lines.push(`   Razón: ${this.truncate(intent.reason, 200)}`);
      lines.push(`   Acción: ${this.truncate(intent.suggestedAction, 200)}`);
      if (intent.expiresAt) {
        lines.push(`   Vence: ${new Date(intent.expiresAt).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}`);
      }
      lines.push('');
    }

    if (reasoning) {
      lines.push(`<i>Razonamiento previo:</i>`);
      lines.push(this.truncate(reasoning, 500));
    }

    return lines.join('\n');
  }

  private truncate(s: string, max: number): string {
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + '…';
  }
}
