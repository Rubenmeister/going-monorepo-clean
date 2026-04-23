import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';

// Simple JWT guard stub (implement as needed)
class JwtAuthGuard {}

@Controller('support')
export class ChatController {

  constructor(
    private agentService: AgentService,
    private conversationService: ConversationService,
  ) {}

  /** Web chat: send message */
  @Post('message')
  async sendMessage(@Body() body: { userId: string; message: string }) {
    const { userId, message } = body;
    const reply = await this.agentService.respond(userId, message);
    const conv = await this.conversationService.getOrCreate(userId);
    return {
      reply,
      state: conv.state,
      priority: conv.priority,
    };
  }

  /** Get conversation history */
  @Get(':userId/history')
  async getHistory(@Param('userId') userId: string) {
    const conv = await this.conversationService.getOrCreate(userId);
    return { messages: conv.messages, state: conv.state };
  }

  /** Operator: get handoff queue and tickets */
  @Get('handoff/queue')
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

  /** Admin dashboard: get tickets (conversations in handoff status) */
  @Get('tickets')
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

  /** Admin dashboard: get single ticket details */
  @Get('tickets/:userId')
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

  /** Operator accepts handoff */
  @Post('handoff/:userId/accept')
  async acceptHandoff(@Param('userId') userId: string, @Body() body: { operatorId: string }) {
    await this.conversationService.acceptHandoff(userId, body.operatorId);
    const context = await this.conversationService.buildOperatorContext(userId);
    return { ok: true, context };
  }

  /** Operator resolves and returns control to AI */
  @Post('handoff/:userId/resolve')
  async resolveHandoff(@Param('userId') userId: string) {
    await this.conversationService.resolveHandoff(userId);
    return { ok: true };
  }
}
