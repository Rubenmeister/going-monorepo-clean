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

  // ─── Diagnóstico del estado de la integración WhatsApp ───────
  //
  // GET /whatsapp/diagnose
  // Verifica que cada credencial Meta funcione antes de empezar a
  // recibir mensajes en producción. Útil tras renovar el token o
  // cambiar de número.
  @Get('diagnose')
  async diagnose() {
    const token       = this.config.get<string>('META_WA_ACCESS_TOKEN');
    const phoneId     = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');

    const result: Record<string, any> = {
      timestamp: new Date().toISOString(),
      secrets: {
        META_WA_ACCESS_TOKEN: token ? `set (${token.length} chars)` : 'MISSING',
        WHATSAPP_PHONE_NUMBER_ID: phoneId || 'MISSING',
        WHATSAPP_VERIFY_TOKEN: verifyToken ? 'set' : 'MISSING',
      },
    };

    if (!token || !phoneId) {
      result.status = 'FAIL';
      result.next_step = 'Configura los secrets faltantes en GCP Secret Manager.';
      return result;
    }

    // Probe 1: validar token contra Meta /me
    try {
      const meRes = await fetch(`${META_GRAPH}/me?access_token=${token}`);
      const meData = await meRes.json() as any;
      if (meData.error) {
        result.status = 'FAIL';
        result.error_code = meData.error.code;
        result.error_message = meData.error.message;
        if (String(meData.error.message).includes('Session has expired')) {
          result.next_step = 'Tu token expiró. Sigue las instrucciones en /whatsapp/setup-help para generar un token permanente vía System User.';
        } else if (String(meData.error.message).includes('Application has been deleted')) {
          result.next_step = 'La app de Meta fue eliminada. Crea una nueva en https://developers.facebook.com/apps/ y conecta WhatsApp Business.';
        } else {
          result.next_step = 'Revisa permisos del token: necesita whatsapp_business_messaging + whatsapp_business_management.';
        }
        return result;
      }
      result.token_valid_for = meData.name || meData.id || 'unknown';
    } catch (err) {
      result.status = 'FAIL';
      result.error_message = (err as Error).message;
      return result;
    }

    // Probe 2: phone number metadata
    try {
      const phoneRes = await fetch(`${META_GRAPH}/${phoneId}?access_token=${token}`);
      const phoneData = await phoneRes.json() as any;
      if (phoneData.error) {
        result.status = 'PARTIAL';
        result.phone_error = phoneData.error.message;
        result.next_step = `El token funciona pero no tiene acceso al phone number ${phoneId}. Verifica en Meta Business Manager que el System User tenga acceso a este WABA.`;
        return result;
      }
      result.phone_number = {
        display_number: phoneData.display_phone_number,
        verified_name:  phoneData.verified_name,
        quality_rating: phoneData.quality_rating,
        status:         phoneData.status,
      };
    } catch (err) {
      result.status = 'PARTIAL';
      result.phone_error = (err as Error).message;
      return result;
    }

    // Probe 3: webhook configuration
    const webhookInfo = await this.checkWebhookConfig();
    result.webhook = webhookInfo;

    result.status = 'OK';
    result.next_step = webhookInfo.registered
      ? 'Todo listo. Envía un mensaje al número WhatsApp para probar end-to-end.'
      : `Webhook no registrado en Meta. Configúralo en Meta Business Suite → tu app → WhatsApp → Configuration con URL https://customer-support-service-lw44cnhdeq-uc.a.run.app/whatsapp/webhook y verify token "${verifyToken}".`;

    return result;
  }

  private async checkWebhookConfig(): Promise<Record<string, any>> {
    const token = this.config.get<string>('META_WA_ACCESS_TOKEN');
    const wabaId = this.config.get<string>('WHATSAPP_BUSINESS_ACCOUNT_ID');
    if (!token || !wabaId) {
      return { registered: 'unknown', note: 'Sin WHATSAPP_BUSINESS_ACCOUNT_ID no se puede consultar el webhook desde Meta API.' };
    }
    try {
      const res = await fetch(`${META_GRAPH}/${wabaId}/subscribed_apps?access_token=${token}`);
      const data = await res.json() as any;
      return { registered: !!data?.data?.length, raw: data };
    } catch (err) {
      return { registered: 'unknown', error: (err as Error).message };
    }
  }

  // ─── Guía paso a paso de setup ───────────────────────────────
  @Get('setup-help')
  setupHelp() {
    return {
      passos: [
        '1. Ir a https://developers.facebook.com/apps/ y abrir tu app de Going (o crear una nueva tipo Business)',
        '2. WhatsApp Business → Setup → conectar tu cuenta de WhatsApp Business (WABA)',
        '3. Confirmar que tu número (593984037949 u otro) está en API Setup, sección "From"',
        '4. Para token permanente: Meta Business Suite → Settings → Business Settings → System Users → Add → Admin',
        '5. Al System User → Add Assets → tu WABA + tu App → permiso "Manage WhatsApp Business Account"',
        '6. Generate Token → seleccionar "whatsapp_business_messaging" + "whatsapp_business_management" → Never expires',
        '7. Actualizar secret en GCP: gcloud secrets versions add META_WA_ACCESS_TOKEN --project=going-5d1ae --data-file=- (pegar token y Ctrl+D)',
        '8. Re-deploy customer-support-service (o esperar al próximo redeploy)',
        '9. Webhook URL: https://customer-support-service-lw44cnhdeq-uc.a.run.app/whatsapp/webhook',
        '10. Verify Token: usar el valor del secret WHATSAPP_VERIFY_TOKEN (going_webhook_verify_2024)',
        '11. Suscribirse a "messages" en webhook configuration',
        '12. Enviar mensaje al número desde otro WhatsApp y verificar que el bot responde',
      ],
      verificar_estado: 'GET /whatsapp/diagnose',
    };
  }

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
