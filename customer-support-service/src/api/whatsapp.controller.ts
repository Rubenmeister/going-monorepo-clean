import { Controller, Post, Get, Body, Query, Req, Res, Logger, HttpCode, UseGuards } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { AdminOrInternalGuard } from '../infrastructure/auth/jwt.guard';
import { AgentService } from '../agent/agent.service';
import { ConversationService } from '../agent/conversation.service';
import { ConfigService } from '@nestjs/config';
import { VoiceService } from '../infrastructure/voice.service';
import { WhatsAppService } from '../infrastructure/whatsapp.service';
import { detectLanguage } from '../knowledge-base/system-prompt';

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
  @UseGuards(AdminOrInternalGuard) // Bloque 3: filtraba token/metadata del número
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
  @UseGuards(AdminOrInternalGuard) // Bloque 3: exponía guía/config interna
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
  async handleMessage(@Body() body: any, @Req() req: any, @Res() res: any) {
    // Always respond 200 immediately so Meta doesn't retry
    res.status(200).send('EVENT_RECEIVED');

    // Bloque 3: verifica la firma X-Hub-Signature-256 de Meta. Rollout monitoreado:
    // loguea siempre; SOLO descarta el payload si WHATSAPP_ENFORCE_SIGNATURE=1
    // (tras confirmar en logs que los mensajes reales de Meta validan).
    const sigOk = this.verifyWebhookSignature(req);
    if (!sigOk) {
      this.logger.warn('[whatsapp] webhook con firma inválida o ausente');
      if (process.env.WHATSAPP_ENFORCE_SIGNATURE === '1') {
        return; // fail-closed: no procesamos payload no firmado por Meta
      }
    }

    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value  = change?.value;

      // ── Eventos de LLAMADA de WhatsApp (Calling API) ──
      // El webhook del WABA es único (mensajes + llamadas). El motor de voz +
      // WebRTC vive en voice-call-service, así que reenviamos ahí los eventos
      // 'calls' (connect/terminate con SDP) y no los procesamos aquí.
      if (change?.field === 'calls' || value?.calls?.length) {
        this.forwardCallingEvent(value).catch((e) =>
          this.logger.warn(`[webhook] forward calling event falló: ${(e as Error).message}`),
        );
        return;
      }

      if (!value?.messages?.length) return; // status updates, not messages

      const msg  = value.messages[0];
      const from = msg.from; // e.g. "593999123456"
      let messageText = '';
      let wasAudio = false;
      // sttLang opcional: si el mensaje es audio, capturamos el idioma detectado
      // por Cloud STT (5 idiomas — Item 6 Fase 8). Lo pasamos al AgentService
      // para que (a) responda en ese idioma, (b) TTS use el mismo lang para voz.
      let sttLang: import('../knowledge-base/system-prompt').SupportedLang | undefined;
      // Timestamp del flow completo de voz (Meta delivery → audio enviado).
      // Se inicializa cuando wasAudio=true para medir la latencia perceived
      // por el usuario y descomponer dónde se va el tiempo (download + STT +
      // LLM + TTS + upload + send).
      let voiceFlowStart = 0;

      this.logger.log(`[webhook] type=${msg.type} from=${from} msgId=${msg.id}`);

      if (msg.type === 'text') {
        messageText = msg.text?.body || '';
      } else if (msg.type === 'location') {
        const { latitude, longitude, name } = msg.location;
        messageText = `[UBICACION_GPS:lat=${latitude},lng=${longitude},label=${name || ''}]`;
        this.logger.log(`GPS location from ${from}: ${latitude},${longitude}`);
      } else if (msg.type === 'audio' || msg.type === 'voice') {
        wasAudio = true;
        voiceFlowStart = Date.now();
        // Meta entrega voice notes con type='audio' y msg.audio.id como mediaId.
        // Algunas SDK refieren a msg.voice; fallback a msg.id solo si nada hay.
        const audioMediaId = msg.audio?.id || msg.voice?.id || msg.id;
        this.logger.log(`[audio] mediaId=${audioMediaId} mime=${msg.audio?.mime_type || msg.voice?.mime_type || 'unknown'}`);

        // Sin acuse de recibo (decisión Rubén 2-jul): respuesta DIRECTA en texto,
        // sin anunciar "recibí tu nota". Más rápido y directo.

        // downloadMedia hace 2 round-trips a Meta: 1) GET /media/:id → URL,
        // 2) GET de la URL signed. Total típico 500ms-3s según red.
        const tDownload = Date.now();
        const audioBuffer = await this.whatsappService.downloadMedia(audioMediaId);
        const dtDownload = Date.now() - tDownload;
        if (audioBuffer) {
          this.logger.log(`[audio] downloadMedia ${audioBuffer.length}B en ${dtDownload}ms, calling STT`);
          const stt = await this.voiceService.transcribe(audioBuffer);
          messageText = stt.transcript;
          sttLang = stt.lang;
        } else {
          this.logger.warn(`[audio] downloadMedia returned null in ${dtDownload}ms for ${audioMediaId}`);
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

      // El TEXTO sale PRIMERO y directo (sin acuse previo). Si la consulta vino
      // por VOZ, después mandamos también la respuesta en voz (decisión Rubén
      // 2-jul: solo se quitó el acuse "recibí tu nota", NO la voz).
      if (reply) await this.whatsappService.sendText(from, reply);
      if (wasAudio && reply) {
        const lang   = sttLang ?? detectLanguage(reply);
        const audio  = await this.voiceService.synthesize(reply, lang, conv.agentGender, conv.voicePreference);
        if (audio) await this.whatsappService.sendAudio(from, audio);
        const dtTotal = voiceFlowStart ? Date.now() - voiceFlowStart : 0;
        this.logger.log(`[voice-flow] texto+voz para ${from} en ${dtTotal}ms (${lang}-${conv.agentGender}${conv.voicePreference ? '-' + conv.voicePreference : ''})`);
      }

    } catch (error) {
      this.logger.error('Error processing WhatsApp message', error);
    }
  }

  // ─── Operator sends a message to user ────────────────────────
  /**
   * Reenvía un evento de llamada de WhatsApp (value con calls[]) a
   * voice-call-service, que tiene el motor de voz + WebRTC. Best-effort:
   * el webhook ya respondió 200 a Meta; el manejo real es async.
   */
  private async forwardCallingEvent(value: any): Promise<void> {
    const base = (process.env.VOICE_CALL_SERVICE_URL ||
      'https://voice-call-service-780842550857.us-central1.run.app').replace(/\/$/, '');
    const token = process.env.INTERNAL_SERVICE_TOKEN || '';
    await fetch(`${base}/whatsapp/calling`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-internal-token': token },
      body: JSON.stringify(value ?? {}),
    });
  }

  // Bloque 3: envío saliente desde el número oficial — SOLO admin/servicio interno.
  // Antes sin guard: cualquiera desde internet mandaba WhatsApp a cualquier número.
  @Post('operator-message')
  @UseGuards(AdminOrInternalGuard)
  async operatorMessage(@Body() body: { userId: string; message: string; operatorId: string }) {
    const { userId, message, operatorId } = body;
    if (typeof userId !== 'string' || typeof message !== 'string' || !userId || !message) {
      return { ok: false, error: 'invalid_payload' };
    }
    this.conversationService.addMessage(userId, 'assistant', `[Operador ${operatorId ?? 'ops'}]: ${message}`);
    await this.whatsappService.sendText(userId, message);
    return { ok: true };
  }

  /** Verifica la firma HMAC-SHA256 del webhook de Meta contra FACEBOOK_APP_SECRET. */
  private verifyWebhookSignature(req: any): boolean {
    const secret = process.env.FACEBOOK_APP_SECRET;
    if (!secret) {
      this.logger.warn('[whatsapp] FACEBOOK_APP_SECRET no configurado — firma no verificable');
      return false;
    }
    const header = req?.headers?.['x-hub-signature-256'];
    const raw = req?.rawBody;
    if (typeof header !== 'string' || !header.startsWith('sha256=') || !raw || !Buffer.isBuffer(raw)) {
      return false;
    }
    const expected = 'sha256=' + createHmac('sha256', secret).update(raw).digest('hex');
    try {
      const a = Buffer.from(header);
      const b = Buffer.from(expected);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
