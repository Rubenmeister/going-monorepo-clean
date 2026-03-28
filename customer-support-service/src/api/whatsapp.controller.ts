import { Controller, Post, Get, Body, Query, Res, Logger, HttpCode } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';
import { ConfigService } from '@nestjs/config';
import { SpeechClient } from '@google-cloud/speech';

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
  verifyWebhook(@Query() query: any, @Res() // eslint-disable-next-line @typescript-eslint/no-explicit-any
res: any) {
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
  async handleMessage(@Body() body: any, @Res() // eslint-disable-next-line @typescript-eslint/no-explicit-any
res: any) {
    const from: string = body.From || '';     // e.g. whatsapp:+593999...
    let messageText: string = body.Body || '';
    const userId = from.replace('whatsapp:', '').trim();

    // ── Handle audio messages ──────────────────────────────────────────
    const numMedia = parseInt(body.NumMedia || '0', 10);
    const mediaUrl: string = body.MediaUrl0 || '';
    const mediaType: string = body.MediaContentType0 || '';

    if (numMedia > 0 && mediaType.startsWith('audio/') && mediaUrl) {
      try {
        const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
        const authToken  = this.config.get<string>('TWILIO_AUTH_TOKEN');
        const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const audioRes = await fetch(mediaUrl, {
          headers: { Authorization: `Basic ${creds}` },
        });
        const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

        const speechClient = new SpeechClient();
        const [response] = await speechClient.recognize({
          config: {
            encoding: 'OGG_OPUS' as any,
            sampleRateHertz: 48000,
            languageCode: 'es-EC',
            alternativeLanguageCodes: ['en-US'],
            enableAutomaticPunctuation: true,
          },
          audio: { content: audioBuffer.toString('base64') },
        });

        messageText = response.results
          ?.map((r: any) => r.alternatives?.[0]?.transcript)
          .filter(Boolean)
          .join(' ') || '';

        if (!messageText) {
          const noAudioTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response><Message><Body>No pude entender el audio 🎤 Por favor escribe tu mensaje. / I couldn't understand the audio. Please type your message.</Body></Message></Response>`;
          return res.status(200).type('text/xml').send(noAudioTwiml);
        }

        this.logger.log(`Audio transcribed for ${userId}: "${messageText.slice(0, 80)}"`);
      } catch (audioErr) {
        this.logger.error('Audio transcription error', audioErr);
        messageText = '';
      }
    }

    messageText = messageText.trim();
    if (!messageText) {
      return res.status(200).type('text/xml').send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    // ──────────────────────────────────────────────────────────────────

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
