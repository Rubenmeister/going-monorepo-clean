import { Controller, Post, Get, Body, Query, Res, Logger, HttpCode } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ConversationService, AgentGender } from '../agent/conversation.service';
import { ConfigService } from '@nestjs/config';
import { detectLanguage } from '../knowledge-base/system-prompt';
import { VoiceService } from '../infrastructure/voice.service';

// ============================================================
// Going – WhatsApp Controller (Meta Cloud API)
// Env vars required:
//   WHATSAPP_PHONE_NUMBER_ID  – from Meta Business Suite
//   META_WA_ACCESS_TOKEN      – Page/System User token with whatsapp_business_messaging
//   WHATSAPP_VERIFY_TOKEN     – arbitrary secret to verify webhook
// ============================================================

const META_GRAPH = 'https://graph.facebook.com/v19.0';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private agentService: AgentService,
    private conversationService: ConversationService,
    private voiceService: VoiceService,
    private config: ConfigService,
  ) {}

  // ─── Webhook verification (Meta GET challenge) ────────────────
  @Get('webhook')
  verifyWebhook(@Query() query: any, @Res() res: any) {
    const mode      = query['hub.mode'];
    const token     = query['hub.verify_token'];
    const challenge = query['hub.challenge'];

    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified ✅');
      return res.status(200).send(challenge);
    }
    this.logger.warn('WhatsApp webhook verification failed');
    return res.status(403).send('Forbidden');
  }

  // ─── Incoming messages (Meta POST) ───────────────────────────
  @Post('webhook')
  @HttpCode(200)
  async handleMessage(@Body() body: any, @Res() res: any) {
    // Always respond 200 immediately so Meta doesn't retry
    res.status(200).send('EVENT_RECEIVED');

    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value  = change?.value;

      if (!value?.messages?.length) return; // status updates, not messages

      const msg  = value.messages[0];
      const from = msg.from; // e.g. "593999123456"
      let messageText = '';
      let wasAudio = false;

      if (msg.type === 'text') {
        messageText = msg.text?.body || '';
      } else if (msg.type === 'location') {
        const { latitude, longitude, name } = msg.location;
        messageText = `[UBICACION_GPS:lat=${latitude},lng=${longitude},label=${name || ''}]`;
        this.logger.log(`GPS location from ${from}: ${latitude},${longitude}`);
      } else if (msg.type === 'audio') {
        wasAudio = true;
        messageText = await this.transcribeAudio(msg.id);
        if (!messageText) {
          await this.sendTextMessage(from, 'No pude entender el audio 🎤 Por favor escribe tu mensaje. / I couldn\'t understand the audio. Please type your message.');
          return;
        }
        this.logger.log(`Audio transcribed for ${from}: "${messageText.slice(0, 80)}"`);
      } else {
        this.logger.log(`Unsupported message type from ${from}: ${msg.type}`);
        return;
      }

      messageText = messageText.trim();
      if (!messageText) return;

      this.logger.log(`Incoming WA message from ${from}: "${messageText.slice(0, 50)}"`);

      const conv = await this.conversationService.getOrCreate(from, 'whatsapp');

      // If human agent is active, don't respond with AI
      if (conv.state === 'HUMAN_ACTIVE') return;

      const reply = await this.agentService.respond(from, messageText);

      if (wasAudio) {
        // Respond with audio (TTS) when user sent audio
        const lang   = detectLanguage(messageText);
        const gender = conv.agentGender;
        const sent   = await this.sendAudioMessage(from, reply, lang, gender);
        if (!sent) {
          // Fallback to text if TTS/upload fails
          await this.sendTextMessage(from, reply);
        }
      } else {
        await this.sendTextMessage(from, reply);
      }

    } catch (error) {
      this.logger.error('Error processing WhatsApp message', error);
    }
  }

  // ─── Send text message via Meta Cloud API ────────────────────
  private async sendTextMessage(to: string, text: string): Promise<void> {
    const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const accessToken   = this.config.get<string>('META_WA_ACCESS_TOKEN');

    if (!phoneNumberId || !accessToken) {
      this.logger.error('Missing WHATSAPP_PHONE_NUMBER_ID or META_WA_ACCESS_TOKEN');
      return;
    }

    const res = await fetch(`${META_GRAPH}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Meta send text failed: ${res.status} ${err}`);
    }
  }

  // ─── Send audio message (TTS → Meta upload → WhatsApp audio) ──
  private async sendAudioMessage(
    to: string,
    text: string,
    lang: string,
    gender: AgentGender,
  ): Promise<boolean> {
    try {
      const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
      const accessToken   = this.config.get<string>('META_WA_ACCESS_TOKEN');

      if (!phoneNumberId || !accessToken) return false;

      // Step 1: Generate audio with shared VoiceService (Google Cloud TTS Neural2)
      const audioBuffer = await this.voiceService.synthesize(text, lang, gender);
      if (!audioBuffer) return false;

      // Step 2: Upload audio to Meta media endpoint
      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');
      formData.append('type', 'audio/ogg');
      formData.append(
        'file',
        new Blob([audioBuffer], { type: 'audio/ogg' }),
        'reply.ogg',
      );

      const uploadRes = await fetch(`${META_GRAPH}/${phoneNumberId}/media`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.text();
        this.logger.error(`Meta media upload failed: ${uploadRes.status} ${err}`);
        return false;
      }

      const uploadData = await uploadRes.json() as { id?: string };
      const mediaId = uploadData.id;
      if (!mediaId) return false;

      // Step 3: Send audio message
      const sendRes = await fetch(`${META_GRAPH}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'audio',
          audio: { id: mediaId },
        }),
      });

      if (!sendRes.ok) {
        const err = await sendRes.text();
        this.logger.error(`Meta send audio failed: ${sendRes.status} ${err}`);
        return false;
      }

      this.logger.log(`Audio reply sent to ${to} (${lang}-${gender})`);
      return true;

    } catch (err) {
      this.logger.error('sendAudioMessage error', err);
      return false;
    }
  }

  /**
   * Descarga el audio desde Meta (requiere su access token) y delega
   * la transcripción a VoiceService — compartido con Telegram.
   */
  private async transcribeAudio(mediaId: string): Promise<string> {
    try {
      const accessToken = this.config.get<string>('META_WA_ACCESS_TOKEN');

      const metaRes = await fetch(`${META_GRAPH}/${mediaId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const mediaData = await metaRes.json() as { url?: string };
      if (!mediaData.url) return '';

      const audioRes = await fetch(mediaData.url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

      return await this.voiceService.transcribe(audioBuffer);
    } catch (err) {
      this.logger.error('Audio transcription error', err);
      return '';
    }
  }

  // ─── Operator sends a message to user ────────────────────────
  @Post('operator-message')
  async operatorMessage(@Body() body: { userId: string; message: string; operatorId: string }) {
    const { userId, message, operatorId } = body;
    this.conversationService.addMessage(userId, 'assistant', `[Operador ${operatorId}]: ${message}`);
    await this.sendTextMessage(userId, message);
    return { ok: true };
  }
}
