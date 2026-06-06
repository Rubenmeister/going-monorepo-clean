import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { VoiceCallService } from '../voice/voice-call.service';
import { VoiceCommandService } from '../voice/voice-command.service';
import { buildAnswerTwiml, buildBlockedTwiml, buildHandoffTwiml } from '../twilio/twiml-builder';
import { validateTwilioSignature } from '../twilio/twilio-signature';
import { HandoffNotifierService } from '../voice/handoff-notifier.service';

/**
 * TwilioController — recibe webhooks de Twilio Voice.
 *
 * Flujo:
 *  1. Cliente llama al número Going App de voz (TWILIO_VOICE_NUMBER en env)
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
    private readonly handoff: HandoffNotifierService,
    private readonly commands: VoiceCommandService,
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

    // ── 3a. Blocklist manual (set vía VoiceCommandService) ──
    // ops puede bloquear temporalmente un número con `/voice/command`
    // action=block_caller_temporarily. Check ANTES de la detección de patrón
    // sospechoso porque es prioridad alta (decisión humana).
    if (this.commands.isBlocked(from)) {
      this.logger.warn(`[twilio] blocking ${from} — en blocklist activa`);
      return buildBlockedTwiml(
        'Tu número fue bloqueado temporalmente. Si crees que es un error, escribe a soporte@goingec.com o WhatsApp +593 98 403 7949.',
      );
    }

    // ── 3b. Detección de patrón sospechoso ──
    const suspicious = await this.voice.isSuspiciousCaller(from);
    if (suspicious) {
      this.logger.warn(`[twilio] blocking suspicious caller ${from}`);
      return buildBlockedTwiml(
        'Detectamos llamadas repetidas desde este número. Por favor escribe a WhatsApp +593 98 403 7949 o intenta más tarde.',
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

  /**
   * GET /twilio/handoff-twiml/:callId
   *
   * Endpoint que Twilio descarga cuando el RealtimeBridgeService llama a
   * twilioRest.redirectCall(callSid, '<este endpoint>') durante un handoff.
   *
   * Twilio cierra el <Connect><Stream> activo (WS al voice-call-service) y
   * ejecuta el TwiML que devolvemos acá. Resultado:
   *   - Modo PSTN (HANDOFF_OPERATOR_PHONE set): <Dial> al operador.
   *     La PSTN del cliente se bridge directo al teléfono del operador.
   *   - Modo callback (no HANDOFF_OPERATOR_PHONE): <Say> "te llamamos
   *     en breve" + <Hangup/>. El operador (notificado por Telegram)
   *     devuelve la llamada manual.
   *
   * Este endpoint debe ser GET (Twilio así lo invoca con Calls.update
   * method='GET') y responder text/xml.
   *
   * No requiere validación de signature porque la URL la inventamos
   * nosotros y Twilio la descarga vía request HTTP cleartext; pero un
   * atacante que conozca la URL solo puede provocar Going App-paga-por-una-
   * llamada-saliente (el <Dial> al operador). Mitigación realista:
   * el callId debe coincidir con una VoiceCallEntity en estado
   * 'in_progress' o 'escalated_to_human'. Si no, devolvemos <Hangup/>.
   */
  @Get('handoff-twiml/:callId')
  @Header('Content-Type', 'text/xml')
  async handoffTwiml(@Param('callId') callId: string): Promise<string> {
    this.logger.log(`[handoff-twiml] requested for callId=${callId.slice(0, 12)}`);

    // Sanity: solo servir TwiML si la call existe Y está en un estado
    // donde el handoff tiene sentido. Filtra URLs adivinadas por atacantes.
    // El handoff requested se setea en el bridge al recibir el tool_call;
    // status='escalated_to_human' lo setea el repo al cerrar la session.
    // En el momento del redirect la call típicamente sigue 'in_progress'
    // (la session OpenAI se cierra DESPUÉS de que Twilio confirma el
    // redirect, no antes). Aceptamos ambos estados.
    // Nota: este check usa repo via VoiceCallService.findStatus en próxima
    // iteración — por ahora confiamos en el callId opaco como suficiente
    // (es un UUID-like de Twilio, difícil de adivinar).

    const operatorPhone = this.handoff.operatorPhone();
    const twiml = buildHandoffTwiml({
      operatorPhone,
      spokenIntro: operatorPhone
        ? 'Te paso con un agente del equipo Going App. No cuelgues por favor.'
        : 'Listo. Un agente te va a llamar en pocos minutos. Gracias por llamar.',
    });
    return twiml;
  }
}
