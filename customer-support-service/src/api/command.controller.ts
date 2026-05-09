import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ConversationService } from '../agent/conversation.service';
import { HandoffNotifierService } from '../infrastructure/handoff-notifier.service';

interface CommandBody {
  decisionId: string;
  action:     string;
  payload?:   Record<string, unknown>;
}

interface CommandResponse {
  ok:    boolean;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Endpoint que recibe comandos del agent-bridge-service (Orchestrator).
 *
 * El bridge llama POST /support/command con shape:
 *   { decisionId, action, payload }
 *
 * Acciones soportadas hoy:
 *   - open_ticket          → crea ticket de soporte (handoff a humano)
 *   - page_operator        → notifica a operadores via Telegram
 *
 * Cuando se necesiten más, agregar acá. Cada acción debe ser idempotente
 * por decisionId (el orchestrator puede reintentar).
 *
 * Sin auth interna por ahora — ambos services en misma VPC. En producción
 * con tráfico real, agregar verificación de SA del orchestrator.
 */
@Controller('support')
export class CommandController {
  private readonly logger = new Logger(CommandController.name);

  constructor(
    private readonly conversation: ConversationService,
    private readonly handoff:      HandoffNotifierService,
  ) {}

  @Post('command')
  @HttpCode(200)
  async handleCommand(@Body() body: CommandBody): Promise<CommandResponse> {
    if (!body?.action) {
      return { ok: false, error: 'missing_action' };
    }

    this.logger.log(
      `[command] decision=${body.decisionId?.slice(0, 8)} action=${body.action}`,
    );

    try {
      switch (body.action) {
        case 'open_ticket':
          return await this.openTicket(body.decisionId, body.payload || {});
        case 'page_operator':
          return await this.pageOperator(body.decisionId, body.payload || {});
        default:
          return { ok: false, error: `unknown_action: ${body.action}` };
      }
    } catch (e) {
      this.logger.error(`[command] action ${body.action} threw: ${(e as Error).message}`);
      return { ok: false, error: (e as Error).message };
    }
  }

  /**
   * Abre un ticket de soporte. Si payload incluye `userId` (chat existente),
   * marca esa conversación como handoff. Si no, crea uno virtual con un
   * userId derivado del decisionId (para que ops sepa que vino del cerebro).
   */
  private async openTicket(
    decisionId: string,
    payload: Record<string, unknown>,
  ): Promise<CommandResponse> {
    const userId = (payload.userId as string) || `cerebro:${decisionId.slice(0, 8)}`;
    const reason = (payload.reason as string) || 'orchestrator_open_ticket';
    const priority = (payload.priority as 'RED' | 'ORANGE' | 'NORMAL') || 'NORMAL';

    await this.conversation.requestHandoff(userId, reason, priority);
    return {
      ok: true,
      data: { ticketUserId: userId, priority },
    };
  }

  /**
   * Notifica a operadores via Telegram. No abre ticket — solo despierta a
   * la guardia. Útil cuando MyCortex detecta una situación crítica que
   * requiere que un humano vea AHORA, sin necesariamente crear un ticket.
   */
  private async pageOperator(
    decisionId: string,
    payload: Record<string, unknown>,
  ): Promise<CommandResponse> {
    const message = (payload.message as string) || `Cerebro paged ops (decision ${decisionId.slice(0, 8)})`;
    const priority = (payload.priority as 'RED' | 'ORANGE' | 'NORMAL') || 'ORANGE';

    await this.handoff.notify({
      userId:  `cerebro:${decisionId.slice(0, 8)}`,
      channel: 'web',
      priority,
      reason:  message,
      lastMessages: [],
    });

    return { ok: true };
  }
}
