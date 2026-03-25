import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { ConversationService } from './conversation.service';
import { getSystemPrompt, detectLanguage, detectCanton } from '../knowledge-base/system-prompt';
import { GOING_SERVICES_KB } from '../knowledge-base/going-services';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private client: Anthropic;

  constructor(
    private config: ConfigService,
    private conversationService: ConversationService,
  ) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async respond(userId: string, userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationService.addMessage(userId, 'user', userMessage);

    // Check if handoff is needed
    const { needed, priority } = this.conversationService.detectHandoffTrigger(userMessage);
    if (needed) {
      this.conversationService.requestHandoff(userId, userMessage, priority);
      const lang = detectLanguage(userMessage);
      return lang === 'en'
        ? '🙋 I\'m connecting you with a Going team member. Please wait a moment...'
        : '🙋 Te estoy conectando con un miembro del equipo Going. Por favor espera un momento...';
    }

    const conv = this.conversationService.getOrCreate(userId);

    // Detect context (language + canton mentioned)
    const lang = detectLanguage(userMessage);
    const canton = detectCanton(userMessage);
    const systemPrompt = getSystemPrompt(lang, canton, conv.agentGender);

    // Build messages for Claude
    const messages = conv.messages.slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    try {
      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      });

      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      this.conversationService.addMessage(userId, 'assistant', assistantMessage);
      return assistantMessage;

    } catch (error) {
      this.logger.error('Claude API error', error);
      return lang === 'en'
        ? 'Sorry, I\'m having trouble right now. Please try again in a moment.'
        : 'Disculpa, estoy teniendo problemas en este momento. Por favor intenta de nuevo en un momento.';
    }
  }
}
