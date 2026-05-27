/**
 * Public Chat Controller
 *
 * Endpoint público (sin JWT) para el widget SupportChat que aparece en la
 * home pública de Going. Los visitantes anónimos pueden preguntar sobre
 * tipos de vehículos, tarifas, cobertura, etc. antes de registrarse.
 *
 * El ChatController principal (chat.controller.ts) está protegido con
 * JwtAuthGuard porque maneja conversaciones autenticadas con ownership
 * check (un user solo puede ver su propio history). Acá la conversación
 * es de un userId anónimo generado por el cliente — no hay PII y no hay
 * ownership que proteger.
 *
 * Rate limiting: el api-gateway tiene un ThrottlerModule a 60 req/min
 * que aplica también a este path. Suficiente para abuso casual; si se
 * necesita más estricto, agregar Throttler aquí o gateway-level.
 *
 * Si el visitante pide handoff o el agente detecta intención sensible,
 * la conversación se persiste igual con ese anonId. Cuando el user se
 * registre podemos migrar el history si lo necesitamos (post-launch).
 */

import {
  Controller,
  Post,
  Body,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';

@Controller('support/public')
export class PublicChatController {
  private readonly logger = new Logger(PublicChatController.name);

  constructor(
    private readonly agentService: AgentService,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * POST /support/public/message
   * Body: { userId: string (anónimo del cliente), message: string }
   * Response: { reply: string, state?: string, priority?: string }
   */
  @Post('message')
  async sendPublicMessage(
    @Body() body: { userId: string; message: string },
  ): Promise<{ reply: string; state?: string; priority?: string }> {
    const userId = body?.userId?.trim();
    const message = body?.message?.trim();

    if (!userId || !message) {
      throw new BadRequestException('userId and message are required');
    }
    if (message.length > 1000) {
      throw new BadRequestException('message too long (max 1000 chars)');
    }
    // Forzamos un prefijo `web_anon_` para distinguir userIds anónimos
    // de los autenticados en logs/metrics y prevenir spoofing (que un
    // anon use un userId que coincida con un user real).
    const safeUserId = userId.startsWith('web_anon_')
      ? userId
      : `web_anon_${userId}`;

    try {
      const reply = await this.agentService.respond(safeUserId, message);
      const conv = await this.conversationService.getOrCreate(safeUserId);
      // El agent puede devolver null si OpenAI no está configurado o falla
      // — devolvemos un mensaje genérico friendly en lugar de null.
      return {
        reply:
          reply ??
          'Disculpá, no pude procesar tu pregunta. Probá reformularla o contactá soporte: 0984037949',
        state: conv.state,
        priority: conv.priority,
      };
    } catch (err) {
      this.logger.error(
        `Public chat error for ${safeUserId}: ${(err as Error).message}`,
      );
      // Fallback resiliente: nunca exponemos errores internos al visitante.
      return {
        reply:
          'Disculpá, tuvimos un problema técnico. Probá de nuevo en unos minutos, o contactanos al 0984037949.',
      };
    }
  }
}
