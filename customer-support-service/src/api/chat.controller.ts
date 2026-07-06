import { Controller, Post, Get, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';
import { JwtAuthGuard, AdminGuard, CurrentUser, AuthUser } from '../infrastructure/auth/jwt.guard';

/**
 * Soporte web — todas las rutas requieren JWT válido (JwtAuthGuard).
 * Las rutas de operador/admin (handoff queue, tickets, accept, resolve)
 * además requieren rol admin (AdminGuard).
 *
 * Para el `userId` en path params: validamos que el caller solo accede
 * a SU PROPIA conversación, excepto si es admin (puede ver cualquier
 * userId).
 */
@Controller('support')
@UseGuards(JwtAuthGuard)
export class ChatController {

  constructor(
    private agentService: AgentService,
    private conversationService: ConversationService,
  ) {}

  /** Web chat: send message (user authenticated) */
  @Post('message')
  async sendMessage(
    @CurrentUser() caller: AuthUser,
    @Req() req: { headers: { authorization?: string } },
    @Body() body: { userId: string; message: string },
  ) {
    const { userId, message } = body;
    // Ownership check: solo puedes mandar mensajes en TU conversación.
    if (userId !== caller.id && !caller.roles.includes('admin')) {
      throw new ForbiddenException('No tienes permiso para hablar por otra persona usuaria');
    }
    // Audiencia por rol del JWT: si quien escribe es conductora o conductor,
    // el asistente usa el prompt de soporte a conductores.
    const audience = caller.roles?.includes('driver') ? ('driver' as const) : undefined;
    // Reenviamos el JWT del usuario para que el asistente pueda consultar SU
    // viaje activo en transport (tool get_my_active_ride) en su nombre.
    const authToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const reply = await this.agentService.respond(userId, message, { audience, authToken });
    const conv = await this.conversationService.getOrCreate(userId);
    return {
      reply,
      state: conv.state,
      priority: conv.priority,
    };
  }

  /** Get conversation history — solo dueño o admin */
  @Get(':userId/history')
  async getHistory(
    @CurrentUser() caller: AuthUser,
    @Param('userId') userId: string,
  ) {
    if (userId !== caller.id && !caller.roles.includes('admin')) {
      throw new ForbiddenException('No tienes acceso a esta conversación');
    }
    const conv = await this.conversationService.getOrCreate(userId);
    return { messages: conv.messages, state: conv.state };
  }

  /** Operator: get handoff queue — admin only */
  @Get('handoff/queue')
  @UseGuards(AdminGuard)
  async getQueue() {
    const queue = await this.conversationService.getHandoffQueue();
    return queue.map(c => ({
      userId: c.userId,
      channel: c.channel,
      priority: c.priority,
      reason: c.handoffReason,
      createdAt: c.createdAt,
    }));
  }

  /** Admin dashboard: list tickets — admin only */
  @Get('tickets')
  @UseGuards(AdminGuard)
  async getTickets(@Query('status') status?: string) {
    const tickets = await this.conversationService.getHandoffQueue(status);
    return {
      count: tickets.length,
      tickets: tickets.map(c => ({
        id: c.id,
        userId: c.userId,
        channel: c.channel,
        priority: c.priority,
        reason: c.handoffReason,
        operatorId: c.operatorId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }

  /** Admin dashboard: get single ticket — admin only */
  @Get('tickets/:userId')
  @UseGuards(AdminGuard)
  async getTicket(@Param('userId') userId: string) {
    const context = await this.conversationService.buildOperatorContext(userId);
    const conv = await this.conversationService.getOrCreate(userId);
    return {
      id: conv.id,
      userId: conv.userId,
      channel: conv.channel,
      priority: conv.priority,
      state: conv.state,
      reason: conv.handoffReason,
      operatorId: conv.operatorId,
      context,
      messages: conv.messages,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }

  /** Operator accepts handoff — admin only */
  @Post('handoff/:userId/accept')
  @UseGuards(AdminGuard)
  async acceptHandoff(@Param('userId') userId: string, @Body() body: { operatorId: string }) {
    await this.conversationService.acceptHandoff(userId, body.operatorId);
    const context = await this.conversationService.buildOperatorContext(userId);
    return { ok: true, context };
  }

  /** Operator resolves and returns control to AI — admin only */
  @Post('handoff/:userId/resolve')
  @UseGuards(AdminGuard)
  async resolveHandoff(@Param('userId') userId: string) {
    await this.conversationService.resolveHandoff(userId);
    return { ok: true };
  }
}
