import { Controller, Post, Get, Body, Query, Res, Logger, HttpCode } from '@nestjs/common';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';
import { ConfigService } from '@nestjs/config';
import { detectLanguage } from '../knowledge-base/system-prompt';
import { VoiceService } from '../infrastructure/voice.service';
import { WhatsAppService } from '../infrastructure/whatsapp.service';

// ============================================================
// Going – WhatsApp Controller (Meta Cloud API)
// Env vars required:
//   WHATSAPP_PHONE_NUMBER_ID  – from Meta Business Suite
//   META_WA_ACCESS_TOKEN      – Page/System User token with whatsapp_business_messaging
//   WHATSAPP_VERIFY_TOKEN     – arbitrary secret to verify webhook
//
// Las llamadas a la Graph API viven en WhatsAppService (infra). Aquí solo
// se manejan webhooks, autenticación y orquestación del agente.
// ============================================================

const META_GRAPH = 'https://graph.facebook.com/v19.0';

@Controller('whatsapp')
export class WhatsAppController {
  private readonly logger = new Logger(WhatsAppController.name);

  constructor(
    private agentService: AgentService,
    private conversationService: ConversationService,
    private voiceService: VoiceService,
    private whatsappService: WhatsAppService,
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
      // sttLang opcional: si el mensaje es audio, capturamos el idioma detectado
      // por Cloud STT (5 idiomas — Item 6 Fase 8). Lo pasamos al AgentService
      // para que (a) responda en ese idioma, (b) TTS use el mismo lang para voz.
      let sttLang: import('../knowledge-base/system-prompt').SupportedLang | undefined;

      this.logger.log(`[webhook] type=${msg.type} from=${from} msgId=${msg.id}`);

      if (msg.type === 'text') {
        messageText = msg.text?.body || '';
      } else if (msg.type === 'location') {
        const { latitude, longitude, name } = msg.location;
        messageText = `[UBICACION_GPS:lat=${latitude},lng=${longitude},label=${name || ''}]`;
        this.logger.log(`GPS location from ${from}: ${latitude},${longitude}`);
      } else if (msg.type === 'audio' || msg.type === 'voice') {
        wasAudio = true;
        // Meta entrega voice notes con type='audio' y msg.audio.id como mediaId.
        // Algunas SDK refieren a msg.voice; fallback a msg.id solo si nada hay.
        const audioMediaId = msg.audio?.id || msg.voice?.id || msg.id;
        this.logger.log(`[audio] mediaId=${audioMediaId} mime=${msg.audio?.mime_type || msg.voice?.mime_type || 'unknown'}`);

        // ACK INMEDIATO — antes del download+stt+gemini+tts que puede tomar
        // 30-90 seg total. Sin esto el usuario queda en silencio y siente que
        // el bot no recibió su nota. Fire-and-forget: si la red está lenta el
        // ack puede llegar después que la respuesta real, no hay problema.
        this.whatsappService.sendText(
          from,
          '🎙️ Recibí tu nota de voz, dame un momento mientras te respondo...',
        ).catch((err) =>
          this.logger.warn(`[audio] ack send failed: ${(err as Error).message}`),
        );

        const audioBuffer = await this.whatsappService.downloadMedia(audioMediaId);
        if (audioBuffer) {
          this.logger.log(`[audio] buffer ${audioBuffer.length} bytes, calling STT`);
          const stt = await this.voiceService.transcribe(audioBuffer);
          messageText = stt.transcript;
          sttLang = stt.lang;
        } else {
          this.logger.warn(`[audio] downloadMedia returned null for ${audioMediaId}`);
        }
        if (!messageText) {
          this.logger.warn(`[audio] empty transcript from ${from}, sending fallback`);
          await this.whatsappService.sendText(from, 'No pude entender el audio 🎤 Por favor escribe tu mensaje. / I couldn\'t understand the audio. Please type your message.');
          return;
        }
        this.logger.log(`Audio transcribed for ${from} (lang=${sttLang}): "${messageText.slice(0, 80)}"`);
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

      // Pasamos sttLang al agent — si es audio, usa el idioma confiable de STT
      // (no re-detecta por regex sobre el transcript). Si es texto, el agent
      // hace su propia detección con detectLanguage().
      const reply = await this.agentService.respond(from, messageText, sttLang ? { lang: sttLang } : undefined);

      if (wasAudio) {
        // Respond with audio (TTS). Para el TTS preferimos el idioma de STT
        // (más confiable que regex sobre el transcript del usuario).
        // Fallback: si por alguna razón no tenemos sttLang, detectamos del reply text.
        const lang   = sttLang ?? detectLanguage(reply || '');
        const gender = conv.agentGender;
        const audio  = reply ? await this.voiceService.synthesize(reply, lang, gender) : null;
        const sent   = audio ? await this.whatsappService.sendAudio(from, audio) : false;
        if (sent) {
          this.logger.log(`Audio reply sent to ${from} (${lang}-${gender})`);
        } else {
          // Fallback to text if TTS/upload fails
          await this.whatsappService.sendText(from, reply);
        }
      } else {
        await this.whatsappService.sendText(from, reply);
      }

    } catch (error) {
      this.logger.error('Error processing WhatsApp message', error);
    }
  }

  // ─── Operator sends a message to user ────────────────────────
  @Post('operator-message')
  async operatorMessage(@Body() body: { userId: string; message: string; operatorId: string }) {
    const { userId, message, operatorId } = body;
    this.conversationService.addMessage(userId, 'assistant', `[Operador ${operatorId}]: ${message}`);
    await this.whatsappService.sendText(userId, message);
    return { ok: true };
  }
}
