import {
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { VoiceCallService } from '../voice/voice-call.service';
import { buildAnswerTwiml, buildBlockedTwiml } from '../twilio/twiml-builder';
import { validateTwilioSignature } from '../twilio/twilio-signature';

/**
 * TwilioController — recibe webhooks de Twilio Voice.
 *
 * Flujo:
 *  1. Cliente llama al número Going +593 99 278 1751
 *  2. Twilio dispara POST /twilio/voice-webhook con CallSid, From, To
 *  3. Validamos firma X-Twilio-Signature (anti-spoof) — ⚠️ STUB
 *  4. VoiceCallService.onCallInitiated() persiste + publica al cerebro
 *  5. Si suspicious_caller → respondemos TwiML <Hangup/> + alerta
 *  6. Caso normal → respondemos TwiML con <Connect><Stream> al WS bidi
 *     /twilio/media-stream (donde el TwilioMediaStreamGateway hace el
 *     bridge a OpenAI Realtime)
 *
 * STUB: paso 5 (suspicious) implementado. Paso 6 (TwiML para conectar al
 * media stream) hardcoded — falta el gateway WS real.
 */
@Controller('twilio')
export class TwilioController {
  private readonly logger = new Logger(TwilioController.name);
  private readonly twilioAuthToken: string;
  private readonly publicWsUrl: string;
  private readonly publicWebhookUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly voice: VoiceCallService,
  ) {
    this.twilioAuthToken = this.config.get<string>('TWILIO_AUTH_TOKEN') ?? '';
    // wss://api.goingec.com/voice-calls/twilio/media-stream — la URL pública
    // del WS que Twilio conecta. En dev puede sobreescribirse con ngrok.
    this.publicWsUrl = this.config.get<string>('TWILIO_MEDIA_STREAM_WSS_URL') ??
      'wss://api.goingec.com/voice-calls/twilio/media-stream';
    // URL EXACTA que el webhook está expuesto en la consola Twilio. Twilio
    // firma el HMAC sobre ESTA url (incluyendo el host y path), no la
    // interna del container. Por defecto asumimos la del Cloud Run direct.
    this.publicWebhookUrl = this.config.get<string>('TWILIO_WEBHOOK_PUBLIC_URL') ??
      'https://voice-call-service-780842550857.us-central1.run.app/twilio/voice-webhook';

    if (!this.twilioAuthToken) {
      this.logger.warn(
        '[twilio] TWILIO_AUTH_TOKEN no configurado — validación de firma DESACTIVADA. SOLO usar en dev.',
      );
    }
  }

  /**
   * Twilio Voice webhook — entry point de cada llamada entrante.
   * Twilio espera respuesta XML TwiML en <30s o cuelga la llamada.
   */
  @Post('voice-webhook')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/xml')
  async voiceWebhook(
    @Body() body: any,
    @Req() req: Request,
  ): Promise<string> {
    // ── 1. Validación de firma anti-spoof ──
    // Twilio firma cada webhook con HMAC-SHA1 sobre la URL + sortedParams.
    // Sin esto, cualquiera podría disparar llamadas falsas y gastar el
    // budget de OpenAI Realtime con webhooks fabricados. Crítico para prod.
    const signature = req.headers['x-twilio-signature'] as string | undefined;
    if (this.twilioAuthToken) {
      const valid = validateTwilioSignature({
        url:       this.publicWebhookUrl,
        params:    (body ?? {}) as Record<string, string>,
        signature,
        authToken: this.twilioAuthToken,
      });
      if (!valid) {
        this.logger.warn(
          `[twilio] firma inválida from ${req.socket?.remoteAddress} — sig=${signature?.slice(0, 12)}... — rechazando`,
        );
        return buildBlockedTwiml('Solicitud no autorizada.');
      }
    } else if (!signature) {
      // Sin AUTH_TOKEN configurado, en dev al menos exigimos que vengan
      // ALGUN signature header (rechaza scripts que prueban /twilio/voice-webhook
      // a ciegas). En prod siempre va a haber AUTH_TOKEN.
      this.logger.warn(`[twilio] webhook sin X-Twilio-Signature ni AUTH_TOKEN — rechazando`);
      return buildBlockedTwiml('No autorizado.');
    }

    // ── 2. Parseo del payload ──
    // Twilio envía POST form-encoded con: CallSid, From, To, AccountSid, etc.
    const callId = body?.CallSid as string;
    const from   = body?.From   as string;
    const to     = body?.To     as string;

    if (!callId || !from || !to) {
      this.logger.warn(`[twilio] webhook payload inválido: ${JSON.stringify(body).slice(0, 200)}`);
      return buildBlockedTwiml('Solicitud inválida.');
    }

    this.logger.log(`[twilio] incoming call CallSid=${callId} from=${from} to=${to}`);

    // ── 3. Detección de patrón sospechoso ──
    const suspicious = await this.voice.isSuspiciousCaller(from);
    if (suspicious) {
      this.logger.warn(`[twilio] blocking suspicious caller ${from}`);
      return buildBlockedTwiml(
        'Detectamos llamadas repetidas desde este número. Por favor escribe a WhatsApp +593 99 278 1751 o intenta más tarde.',
      );
    }

    // ── 4. Persist + publish ──
    const call = await this.voice.onCallInitiated({ callId, from, to });

    // ── 5. Responder TwiML para conectar al media stream WS ──
    // El WS gateway hace el bridge bidi con OpenAI Realtime. Twilio reenvía
    // audio frames y recibe los frames de respuesta del AI.
    return buildAnswerTwiml({
      callId,
      mediaStreamUrl: this.publicWsUrl,
      runId:          call.runId,
      from,
    });
  }

  /**
   * Twilio status callback — opcional pero recomendado. Twilio notifica
   * cuando la llamada termina con CallDuration, etc. Útil para cerrar
   * llamadas que el WS no detectó (edge case de desconexión).
   */
  @Post('status-callback')
  @HttpCode(HttpStatus.OK)
  async statusCallback(@Body() body: any): Promise<{ ok: true }> {
    const callId = body?.CallSid as string;
    const callStatus = body?.CallStatus as string;
    const duration = parseInt(body?.CallDuration as string, 10) || 0;

    this.logger.log(`[twilio] status callback CallSid=${callId} status=${callStatus} duration=${duration}s`);

    // Si Twilio reporta 'completed' / 'failed' / 'busy' / 'no-answer' y aún
    // no cerramos el call, cerrar ahora con outcome 'failed_technical'.
    if (['completed', 'failed', 'busy', 'no-answer'].includes(callStatus)) {
      const outcome =
        callStatus === 'completed'  ? 'resolved_by_ai' as const :
        callStatus === 'no-answer'  ? 'abandoned_by_caller' as const :
        'failed_technical' as const;
      await this.voice.onCallEnded(callId, { outcome });
    }

    return { ok: true };
  }
}
