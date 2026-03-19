import { Controller, Post, Get, Body, Query, Res, Logger, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';
import { ConfigService } from '@nestjs/config';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private agentService: AgentService,
    private conversationService: ConversationService,
    private config: ConfigService,
  ) {}

  /**
   * Twilio WhatsApp webhook verification (GET)
   */
  @Get('webhook')
  verifyWebhook(@Query() query: any, @Res() res: Response) {
    // Twilio doesn't require GET verification like Meta
    // But we keep this for health checks
    return res.status(200).send('GOING WhatsApp webhook active');
  }

  /**
   * Incoming WhatsApp messages via Twilio (POST)
   * Twilio sends: From, Body, MessageSid, etc.
   */
  @Post('webhook')
  @HttpCode(200)
  async handleMessage(@Body() body: any, @Res() res: Response) {
    const from: string = body.From || '';     // e.g. whatsapp:+593999...
    const messageText: string = body.Body || '';
    const userId = from.replace('whatsapp:', '').trim();

    this.logger.log(`Incoming WA message from ${userId}: "${messageText.slice(0, 50)}"`);

    const conv = this.conversationService.getOrCreate(userId, 'whatsapp');

    // If conversation is with a human agent, don't respond with AI
    if (conv.state === 'HUMAN_ACTIVE') {
      // Operator will respond via the support panel
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }

    try {
      const reply = await this.agentService.respond(userId, messageText);

      // Respond using Twilio TwiML
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>
    <Body>${escapeXml(reply)}</Body>
  </Message>
</Response>`;
      return res.status(200).type('text/xml').send(twiml);

    } catch (error) {
      this.logger.error('Error processing WhatsApp message', error);
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message><Body>Disculpa, ocurrió un error. Por favor intenta de nuevo. / Sorry, an error occurred. Please try again.</Body></Message>
</Response>`;
      return res.status(200).type('text/xml').send(errorTwiml);
    }
  }

  /**
   * Operator sends a message to a user via WhatsApp
   */
  @Post('operator-message')
  async operatorMessage(@Body() body: { userId: string; message: string; operatorId: string }) {
    const { userId, message, operatorId } = body;
    this.conversationService.addMessage(userId, 'assistant', `[Operador ${operatorId}]: ${message}`);
    // TODO: send via Twilio client.messages.create to whatsapp:+userId
    return { ok: true };
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
