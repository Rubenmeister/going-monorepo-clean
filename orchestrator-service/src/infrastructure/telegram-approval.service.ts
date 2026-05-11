import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DecisionEntity } from './schemas/decision.schema';

/**
 * Notificador Telegram para aprobaciones de Cat 3.
 *
 * Diseño actual (Etapa A3):
 *   El mensaje incluye un deep-link directo al admin-dashboard
 *   /cerebro/decisions/[id] donde están los botones Approve/Reject.
 *   El operador hace click → admin-dashboard hace POST a
 *   /orchestrator/decisions/:id/approve|reject. No hay webhook de
 *   Telegram para recibir comandos — la UI hace la mitad del trabajo
 *   y es más auditable.
 *
 * Inline keyboards con buttons "Approve"/"Reject" como reply markup serían
 * más bonitos pero requieren un webhook handler que reciba callback queries
 * + valida secret de Telegram. Se agrega cuando el flujo Cat 3 esté maduro.
 */
@Injectable()
export class TelegramApprovalService {
  private readonly logger = new Logger(TelegramApprovalService.name);

  constructor(private readonly config: ConfigService) {}

  async requestApproval(decision: DecisionEntity): Promise<boolean> {
    const token  = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    if (!token || !chatId) {
      this.logger.warn('TELEGRAM_BOT_TOKEN/CHAT_ID no configurados — skipping approval request');
      return false;
    }

    const expiresIn = decision.expiresAt
      ? Math.max(0, Math.floor((decision.expiresAt.getTime() - Date.now()) / 60000))
      : 15;

    const adminBase = this.config.get<string>('ADMIN_DASHBOARD_URL') ?? 'https://admin.goingec.com';
    const approveUrl = `${adminBase}/cerebro/decisions/${decision.decisionId}`;
    const text = [
      `🚦 <b>Aprobación requerida</b> (Cat 3)`,
      ``,
      `<b>Tipo:</b> <code>${decision.intentionType}</code>`,
      `<b>Agente:</b> ${decision.agentId}`,
      `<b>Acción:</b> ${decision.action}`,
      decision.intentionUrgency !== undefined
        ? `<b>Urgencia:</b> ${decision.intentionUrgency.toFixed(2)}`
        : '',
      ``,
      `<b>Args:</b>`,
      `<code>${JSON.stringify(decision.args, null, 2).slice(0, 800)}</code>`,
      ``,
      `<b>Decisión ID:</b> <code>${decision.decisionId.slice(0, 8)}…</code>`,
      `<b>Vence en:</b> ${expiresIn} min`,
      ``,
      `👉 <a href="${approveUrl}">Aprobar / Rechazar en admin-dashboard</a>`,
    ].filter(Boolean).join('\n');

    return this.send(token, chatId, text);
  }

  async notifyExecution(decision: DecisionEntity): Promise<boolean> {
    const token  = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return false;

    const emoji = decision.outcome === 'success' ? '✅' : '❌';
    const text = [
      `${emoji} <b>Ejecutado</b> — <code>${decision.intentionType}</code>`,
      `Agente: ${decision.agentId} | Acción: ${decision.action}`,
      decision.outcome === 'failure' && decision.errorMessage
        ? `Error: ${decision.errorMessage.slice(0, 200)}`
        : '',
      `<b>ID:</b> <code>${decision.decisionId.slice(0, 8)}</code>`,
    ].filter(Boolean).join('\n');

    return this.send(token, chatId, text);
  }

  async notifyHumanOnly(decision: DecisionEntity): Promise<boolean> {
    const token  = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const chatId = this.config.get<string>('TELEGRAM_CHAT_ID');
    if (!token || !chatId) return false;

    const text = [
      `👤 <b>Decisión humana requerida</b>`,
      ``,
      `<b>Tipo:</b> <code>${decision.intentionType}</code>`,
      `<b>Razón:</b> ${decision.humanOnlyReason}`,
      ``,
      `Esta intención no tiene una acción automática mapeada. Revisar y`,
      `decidir manualmente. Ver detalles en /admin/cerebro/intentions.`,
    ].join('\n');

    return this.send(token, chatId, text);
  }

  private async send(token: string, chatId: string, text: string): Promise<boolean> {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text:    text.slice(0, 4000),
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });
      const data = (await res.json()) as { ok: boolean; description?: string };
      if (!data.ok) {
        this.logger.error(`Telegram error: ${data.description}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error(`Telegram exception: ${(e as Error).message}`);
      return false;
    }
  }
}
