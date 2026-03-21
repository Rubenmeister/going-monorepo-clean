import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';

@Controller('chat')
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
    const conv = this.conversationService.getOrCreate(userId);
    return {
      reply,
      state: conv.state,
      priority: conv.priority,
    };
  }

  /** Get conversation history */
  @Get(':userId/history')
  getHistory(@Param('userId') userId: string) {
    const conv = this.conversationService.getOrCreate(userId);
    return { messages: conv.messages, state: conv.state };
  }

  /** Operator: get handoff queue */
  @Get('handoff/queue')
  getQueue() {
    return this.conversationService.getHandoffQueue().map(c => ({
      userId: c.userId,
      channel: c.channel,
      priority: c.priority,
      reason: c.handoffReason,
      context: this.conversationService.buildOperatorContext(c.userId),
      createdAt: c.createdAt,
    }));
  }

  /** Operator accepts handoff */
  @Post('handoff/:userId/accept')
  acceptHandoff(@Param('userId') userId: string, @Body() body: { operatorId: string }) {
    this.conversationService.acceptHandoff(userId, body.operatorId);
    return { ok: true, context: this.conversationService.buildOperatorContext(userId) };
  }

  /** Operator resolves and returns control to AI */
  @Post('handoff/:userId/resolve')
  resolveHandoff(@Param('userId') userId: string) {
    this.conversationService.resolveHandoff(userId);
    return { ok: true };
  }
}
