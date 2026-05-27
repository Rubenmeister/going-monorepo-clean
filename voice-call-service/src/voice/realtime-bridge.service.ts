import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OpenAIRealtimeAdapter,
  RealtimeSession,
} from '../realtime/openai-realtime.adapter';
import {
  VOICE_TOOLS_PHONE,
  executeGetQuotePhone,
  executeHandoffPhone,
  executeSendFollowupSms,
} from '../realtime/voice-tools-phone';
import { VoiceCallService } from './voice-call.service';
import { HandoffNotifierService } from './handoff-notifier.service';
import { TwilioRestClient } from '../twilio/twilio-rest.client';
import {
  VoicePreferenceClient,
  defaultVoiceForLanguage,
} from './voice-preference.client';

/**
 * RealtimeBridgeService — orquesta el ciclo de vida de una sesión Realtime
 * por llamada Twilio. Es el "pegamento" entre Twilio Media Streams y
 * OpenAI Realtime API.
 *
 * Lifecycle por call:
 *
 *   Twilio 'start'  → bridge.startCallSession(streamSid, callId, ...)
 *                     ├── crea RealtimeSession con g711_ulaw both sides
 *                     ├── registra tools VOICE_TOOLS_PHONE
 *                     └── hookea audio.delta → enviar Twilio media event
 *
 *   Twilio 'media'  → bridge.forwardCallerAudio(streamSid, mulawB64)
 *                     └── session.sendAudio(Buffer.from(b64, 'base64'))
 *                         (NO conversión — g711_ulaw nativo end-to-end)
 *
 *   OpenAI 'audio.delta' → gateway.sendAudioToStream(streamSid, b64)
 *                          (chunk ya viene en μ-law, lo pasamos crudo)
 *
 *   OpenAI 'tool.call'   → ejecuta handler local → session.sendToolResult(...)
 *
 *   OpenAI 'input.transcript.done' / 'response.done' → acumular transcript
 *
 *   Twilio 'stop' o WS close → bridge.endCallSession(streamSid)
 *                              ├── session.close()
 *                              ├── voice.onCallEnded(callId, outcome, transcript, ...)
 *                              └── publica evento al cerebro vía publisher
 *
 * Note: el bridge mantiene 1:1 con streamSid (cada call tiene su session
 * independiente — no se reusan). El estado se libera al endCallSession.
 *
 * Configuración OpenAI Realtime para Twilio:
 *  - inputAudioFormat:  'g711_ulaw' (Twilio entrega μ-law 8kHz nativo)
 *  - outputAudioFormat: 'g711_ulaw' (OpenAI puede generar μ-law directo)
 *  - turnDetection: server_vad (OpenAI detecta silencio para responder)
 *  - voice: por config (default 'shimmer' equivale a 'Kore' female warm)
 *
 * Sin esta configuración, deberíamos convertir cada chunk con audio-codec.ts
 * — funciona pero agrega ~5-10ms por chunk + complejidad. g711 nativo es
 * la elección obvia para WhatsApp/teléfono.
 */
@Injectable()
export class RealtimeBridgeService {
  private readonly logger = new Logger(RealtimeBridgeService.name);
  private readonly defaultVoice: string;
  private readonly defaultLanguage: string;
  /**
   * Base URL pública del voice-call-service (donde Twilio descarga el
   * handoff-twiml). Necesaria solo para el modo PSTN transfer real.
   * Default: el Cloud Run URL del service. Override via env si está detrás
   * de un custom domain o load balancer.
   */
  private readonly publicBaseUrl: string;
  /**
   * Sessions activas indexadas por streamSid de Twilio. Cada sesión es
   * 1 llamada — al cerrar la WS de Twilio, removemos la entry.
   */
  private readonly sessions = new Map<string, BridgeContext>();

  constructor(
    private readonly config: ConfigService,
    private readonly adapter: OpenAIRealtimeAdapter,
    private readonly voice: VoiceCallService,
    private readonly handoff: HandoffNotifierService,
    private readonly twilioRest: TwilioRestClient,
    private readonly voicePref: VoicePreferenceClient,
  ) {
    this.defaultVoice    = this.config.get<string>('VOICE_REALTIME_DEFAULT_VOICE') || 'shimmer';
    this.defaultLanguage = this.config.get<string>('VOICE_REALTIME_DEFAULT_LANG')  || 'es';
    this.publicBaseUrl   = this.config.get<string>('VOICE_CALL_PUBLIC_BASE_URL') ||
      'https://voice-call-service-780842550857.us-central1.run.app';
  }

  /**
   * Inicia una sesión Realtime para una llamada Twilio recién conectada.
   * El caller (TwilioMediaStreamGateway) le pasa un `sendAudioBack` que
   * permite al bridge enviar audio de respuesta hacia Twilio sin tener
   * referencia directa al WS.
   *
   * Si OpenAI no está configurado o falla connect, marca la call como
   * failed y retorna null — el caller debe cerrar la WS limpiamente.
   */
  async startCallSession(input: {
    streamSid:        string;
    callId:           string;
    runId?:           string;
    /** E.164 del caller — necesario para notificar al operador en handoff. */
    from?:            string;
    sendAudioBack:    (mulawPayloadB64: string) => boolean;
    clearAudioBack?:  () => void;
  }): Promise<BridgeContext | null> {
    if (!this.adapter.isConfigured()) {
      this.logger.error(
        `[bridge] OpenAI no configurado — no podemos atender call ${input.callId}`,
      );
      return null;
    }

    if (this.sessions.has(input.streamSid)) {
      this.logger.warn(`[bridge] streamSid ${input.streamSid} ya tiene sesión activa — devolviendo la existente`);
      return this.sessions.get(input.streamSid)!;
    }

    // Voice Sem 3B: resolver preferencia de idioma/voz del caller.
    // Si user-auth-service responde con preferencia configurada, usar.
    // Si no, fallback a defaults env.
    let language = this.defaultLanguage;
    let voice = this.defaultVoice;
    try {
      const pref = await this.voicePref.resolveByPhone(input.from);
      if (pref) {
        language = pref.language;
        voice = pref.voice ?? defaultVoiceForLanguage(language);
        this.logger.log(
          `[bridge] voice-pref resolved callId=${input.callId} lang=${language} voice=${voice}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        `[bridge] voice-pref lookup fallo: ${e instanceof Error ? e.message : e}; usando defaults`,
      );
    }

    const systemPrompt = this.buildSystemPrompt(input.callId, language);

    const session = this.adapter.createSession({
      voice:              voice as any,
      instructions:       systemPrompt,
      tools:              VOICE_TOOLS_PHONE,
      inputAudioFormat:   'g711_ulaw',
      outputAudioFormat:  'g711_ulaw',
      turnDetection:      { type: 'server_vad', threshold: 0.5, silenceDurationMs: 600 },
      modalities:         ['audio', 'text'],
      inputTranscriptionLanguage: language,
      temperature:        0.7,
    });

    // Acumular transcript para persistir al cierre.
    const transcript: Array<{ role: 'user' | 'assistant'; text: string; t: number }> = [];
    const t0 = Date.now();
    const pushTranscript = (role: 'user' | 'assistant', text: string) => {
      if (!text || !text.trim()) return;
      transcript.push({ role, text: text.trim(), t: Math.round((Date.now() - t0) / 1000) });
    };

    // ── Wire events ────────────────────────────────────────────
    session.on('session.ready', () => {
      this.logger.log(`[bridge] session ready callId=${input.callId} streamSid=${input.streamSid.slice(0, 12)}`);
    });

    session.on('audio.delta', (chunk: Buffer) => {
      // chunk ya viene en g711_ulaw porque configuramos outputAudioFormat=g711_ulaw.
      // Twilio acepta exactamente este shape — pasamos base64 crudo.
      input.sendAudioBack(chunk.toString('base64'));
    });

    session.on('input.transcript.done', (text: string) => {
      pushTranscript('user', text);
      this.logger.debug(`[bridge] user said: "${text.slice(0, 80)}"`);
    });

    session.on('text.done', (text: string) => {
      pushTranscript('assistant', text);
      this.logger.debug(`[bridge] assistant said: "${text.slice(0, 80)}"`);
    });

    session.on('tool.call', async ({ callId: toolCallId, name, argumentsJson }) => {
      const args = (() => { try { return JSON.parse(argumentsJson); } catch { return {}; } })();
      this.logger.log(`[bridge] tool.call name=${name} args=${JSON.stringify(args).slice(0, 200)}`);

      let result: unknown;
      try {
        switch (name) {
          case 'get_quote_phone':
            result = executeGetQuotePhone(args);
            break;

          case 'request_handoff_phone': {
            // Marcamos el ctx para que el outcome al cerrar la call sea
            // 'escalated' + notificamos al operador via Telegram. La
            // transferencia PSTN real (TwiML <Dial>) se hace al cerrar la
            // session — el AI dice su "te paso con alguien" y cuando termina
            // de hablar, cerramos la session y devolvemos el TwiML al stream.
            const handoffResult = executeHandoffPhone(args);
            this.markHandoffRequested(input.streamSid, handoffResult.reason);
            // Fire-and-forget: notif a Telegram operadores. NO bloqueamos
            // el tool result que el LLM está esperando para responder.
            this.handoff.notify({
              callId:            input.callId,
              from:              input.from ?? 'unknown',
              priority:          handoffResult.priority,
              reason:            handoffResult.reason,
              callbackRequested: handoffResult.callback_requested,
              transcript:        transcript.slice(-5).map((t) => ({ role: t.role, text: t.text })),
            }).catch((err) =>
              this.logger.warn(`[bridge] handoff.notify fallo: ${(err as Error).message}`),
            );
            result = handoffResult;
            break;
          }

          case 'send_followup_sms': {
            // Sintetiza la frase hablable + dispara el SMS real (best-effort)
            // contra el `from` del caller. Si Twilio REST no está configurado
            // o el envío falla, el tool result indica error pero el LLM
            // ya puede leer spoken_confirmation y cerrar el turno.
            const baseResult = executeSendFollowupSms(args);
            const smsBody = `Going: ${baseResult.topic ? baseResult.topic + '. ' : ''}${baseResult.details ?? ''}`.trim();
            if (input.from && smsBody) {
              this.twilioRest
                .sendSms(input.from, smsBody)
                .then((r) => {
                  if (!r.ok) {
                    this.logger.warn(
                      `[bridge] send_followup_sms fallo to=${input.from?.slice(0, 4)}...: ${r.error}`,
                    );
                  }
                })
                .catch((err) =>
                  this.logger.warn(`[bridge] send_followup_sms threw: ${(err as Error).message}`),
                );
            }
            result = baseResult;
            break;
          }

          default:
            result = { ok: false, error: 'unknown_tool', name };
        }
      } catch (err) {
        this.logger.error(`[bridge] tool ${name} threw: ${(err as Error).message}`);
        result = { ok: false, error: 'tool_exception', message: (err as Error).message };
      }
      session.sendToolResult(toolCallId, JSON.stringify(result));
    });

    session.on('error', (err) => {
      this.logger.error(`[bridge] OpenAI error callId=${input.callId}: ${err.code} ${err.message}`);
    });

    session.on('closed', (info) => {
      this.logger.log(
        `[bridge] session closed callId=${input.callId} code=${info.code} reason=${info.reason} clean=${info.clean}`,
      );
    });

    // Hook al fin de cada turn del assistant. Si markHandoffRequested fue
    // invocado durante el turn (handoff tool fue llamado), AHORA es el
    // momento de redirigir la PSTN — el AI ya terminó de decir "te paso..."
    // Esperar a response.done evita cortar el audio a mitad de frase.
    //
    // Idempotente: solo se dispara una vez por ctx.handoffRequested+pending.
    session.on('response.done', async () => {
      const ctx = this.sessions.get(input.streamSid);
      if (!ctx || !ctx.handoffRequested || ctx.handoffTransferred) return;
      ctx.handoffTransferred = true; // marcamos antes del await para evitar dobles redirects en race

      const handoffUrl = `${this.publicBaseUrl}/twilio/handoff-twiml/${encodeURIComponent(input.callId)}`;
      this.logger.log(`[bridge] dispatching handoff redirect callId=${input.callId} → ${handoffUrl}`);
      const ok = await this.twilioRest.redirectCall(input.callId, handoffUrl);
      if (!ok) {
        // Si el redirect falla (creds Twilio no configuradas o API down),
        // degradamos a callback mode: cerramos la session y al WS-close
        // Twilio cuelga la llamada. El operador ya está notificado por
        // Telegram y devolverá la llamada manual.
        this.logger.warn(`[bridge] redirectCall fallido callId=${input.callId} — fallback a callback mode`);
      }
      // Cerramos la session OpenAI — el TwiML nuevo de Twilio toma control
      // de la PSTN. Si twilioRest falló, igual cerramos (no sirve mantener
      // OpenAI esperando bytes que ya no van a llegar).
      try { ctx.session.close(); } catch { /* ignore */ }
    });

    // ── Connect ─────────────────────────────────────────────
    try {
      await session.connect();
    } catch (err) {
      this.logger.error(`[bridge] session.connect fallo callId=${input.callId}: ${(err as Error).message}`);
      // Marcar la call como failed_technical para que mycortex pueda razonar
      // sobre tasa de fallos del bridge.
      await this.voice.onCallEnded(input.callId, {
        outcome: 'failed_technical',
        escalationReason: `OpenAI session connect failed: ${(err as Error).message.slice(0, 200)}`,
      }).catch(() => {/* best-effort */});
      return null;
    }

    const ctx: BridgeContext = {
      streamSid:    input.streamSid,
      callId:       input.callId,
      runId:        input.runId,
      session,
      transcript,
      startedAt:    t0,
      handoffRequested:   false,
      handoffTransferred: false,
    };
    this.sessions.set(input.streamSid, ctx);
    return ctx;
  }

  /**
   * Forward de un chunk de audio del usuario (recibido de Twilio) a la
   * sesión Realtime. Pasa bytes crudos sin conversión porque la session
   * está configurada con inputAudioFormat='g711_ulaw'.
   */
  forwardCallerAudio(streamSid: string, mulawPayloadB64: string): void {
    const ctx = this.sessions.get(streamSid);
    if (!ctx) return;
    try {
      ctx.session.sendAudio(Buffer.from(mulawPayloadB64, 'base64'));
    } catch (err) {
      this.logger.warn(`[bridge] sendAudio fallido streamSid=${streamSid.slice(0, 12)}: ${(err as Error).message}`);
    }
  }

  /**
   * Cierra la sesión Realtime + persiste transcript + dispara onCallEnded.
   * Idempotente: si ya se cerró, no rompe.
   */
  async endCallSession(streamSid: string, opts?: { reason?: string }): Promise<void> {
    const ctx = this.sessions.get(streamSid);
    if (!ctx) return;
    this.sessions.delete(streamSid);

    try {
      ctx.session.close();
    } catch { /* ignore */ }

    // Determinar outcome basado en flags del ctx. handoffRequested se setea
    // cuando el tool request_handoff_phone fue invocado durante la sesión.
    const outcome = ctx.handoffRequested
      ? 'escalated' as const
      : ctx.transcript.length === 0
        ? 'abandoned_by_caller' as const
        : 'resolved_by_ai' as const;

    await this.voice.onCallEnded(ctx.callId, {
      outcome,
      transcript:       ctx.transcript,
      escalationReason: opts?.reason,
    }).catch((err) =>
      this.logger.warn(`[bridge] onCallEnded fallo callId=${ctx.callId}: ${(err as Error).message}`),
    );

    this.logger.log(
      `[bridge] call ended callId=${ctx.callId} outcome=${outcome} ` +
      `turns=${ctx.transcript.length} duration=${Math.round((Date.now() - ctx.startedAt) / 1000)}s`,
    );
  }

  /**
   * Marca el bridge para que al cerrar la session el outcome sea 'escalated'.
   * Lo invoca el handler del tool request_handoff_phone (vía el switch en
   * tool.call). Hoy NO transfiere físicamente la call — la implementación
   * real de la transferencia (TwiML <Dial>) queda como pending del task #52.
   */
  markHandoffRequested(streamSid: string, reason: string): void {
    const ctx = this.sessions.get(streamSid);
    if (!ctx) return;
    ctx.handoffRequested = true;
    this.logger.warn(`[bridge] handoff marked callId=${ctx.callId}: ${reason}`);
  }

  // ── Sistema prompt ────────────────────────────────────────

  /**
   * System prompt minimal para el agente telefónico. NO inyectamos FARES
   * ni catalogos completos aquí — el cliente llama get_quote_phone cuando
   * necesita un precio. Mantener el prompt corto baja la latencia del
   * primer token.
   *
   * TODO: agregar lookups dinámicos por hora/canton si vemos en logs que
   * el AI se confunde con preguntas no-quote (horarios, ubicaciones, etc).
   */
  private buildSystemPrompt(callId: string, language: string = 'es'): string {
    if (language === 'en') {
      return [
        'You are Uyari, the phone agent for Going Ecuador — the mobility app of Ecuador.',
        'Going offers: rides within the city, shared and private rides between cities,',
        'and door-to-door parcel delivery. The fleet covers from SUV (4 pax) up to',
        'Bus (30 pax). You answer calls in friendly, natural English.',
        '',
        'RULES:',
        '- Keep replies short (1-3 sentences max). The caller is on the phone.',
        '- For prices: ALWAYS use the get_quote_phone tool. NEVER invent a price.',
        '  Read the spoken_price + spoken_surcharges + spoken_unit fields (already in words).',
        '- If the caller asks for a human, or you detect distress: use request_handoff_phone.',
        '- If they need info they cannot write down: offer send_followup_sms.',
        '- NEVER mention URLs or redirect to apps — they are on a voice call.',
        '- If you do not understand, ask them to repeat (do not assume).',
        '- Going operates on land in continental Ecuador (NOT Galápagos).',
        '- Going does NOT take cash: payments go through the app (card, Datafast, DeUna).',
        '',
        `Internal callId (for your context, never say it aloud): ${callId.slice(0, 16)}.`,
      ].join('\n');
    }
    if (language === 'qu') {
      // Kichwa unificado / quichua ecuatoriano del Chimborazo. Backup en español
      // para que la conversación nunca quede sin respuesta si el caller mezcla.
      return [
        'Kanka Uyariimi kanki, Going Ecuador kompañiyapak teléfono yanapakuk —',
        'Ecuador llaktapi puriy yanapakuk app. Going kushan: llaktata uku puriy,',
        'compartido shuk privado llaktakuna chawpipi, shuk paquetekunata kachay.',
        'Kichwa shimipi ñukanchik runakunata yanapanki. Mishu shimipi tapurikpika,',
        'mishu shimipi kutichinki (mana yanllachu).',
        '',
        'KAMACHIKKUNA:',
        '- Uchilla willapaylla kutichinki (1-3 frases). Llakta teléfono ukupimi.',
        '- Chanikunamantaka, get_quote_phone niska tool-ta ñankunata (ama yallinkichu).',
        '- Runa-yanapakta munakpi, mana alli tukukpi: request_handoff_phone.',
        '- Killkana ushashpaka: send_followup_sms.',
        '- AMA URL-kunata rimaychu — voice call ukupimi.',
        '- Going Ecuadormanta llaktapi puriy (Galápagosmanta MANA).',
        '- Going MANA kullkita chaskin: appwan paganki (tarjeta, Datafast, DeUna).',
        '',
        `Internal callId (kampak yuyaypak, ama riman): ${callId.slice(0, 16)}.`,
      ].join('\n');
    }
    // Default — español ecuatoriano (NO rioplatense)
    return [
      'Eres Uyari, el agente telefónico de Going Ecuador — la app de movilidad del',
      'Ecuador. Going ofrece: viajes dentro de la ciudad, viajes compartidos y',
      'privados entre ciudades, y envíos puerta a puerta. La flota va desde SUV',
      '(4 pax) hasta Bus (30 pax). Atiendes llamadas en español ecuatoriano:',
      'cordial, directo, usando "tú" (no "vos", no "usted", no "vosotros").',
      '',
      'REGLAS:',
      '- Responde corto (1-3 frases máx). El cliente está al teléfono.',
      '- Para precios: SIEMPRE usa la tool get_quote_phone. NUNCA inventes un precio.',
      '  Lee el campo spoken_price + spoken_surcharges + spoken_unit (ya están en palabras).',
      '- Si te piden "hablar con persona" o detectas emergencia/frustración: usa request_handoff_phone.',
      '- Si necesitan info que no pueden tomar nota: ofrece send_followup_sms.',
      '- NO menciones URLs ni dirijas a apps — el cliente está en una llamada de voz.',
      '- Si no entiendes algo, pide que repita (no asumas).',
      '- Going opera por carretera en Ecuador continental (NO Galápagos).',
      '- Going NO acepta efectivo: el pago va por la app (tarjeta, Datafast, DeUna).',
      '- Tours, experiencias y alojamiento están en desarrollo — di "próximamente".',
      '',
      `CallId interno (para tu contexto, no lo menciones al cliente): ${callId.slice(0, 16)}.`,
    ].join('\n');
  }
}

// ─── Estado interno por sesión ────────────────────────────

interface BridgeContext {
  streamSid:        string;
  callId:           string;
  runId?:           string;
  session:          RealtimeSession;
  transcript:       Array<{ role: 'user' | 'assistant'; text: string; t: number }>;
  startedAt:        number;
  /** True cuando el LLM invocó request_handoff_phone durante la sesión. */
  handoffRequested:  boolean;
  /** True después de que disparamos el twilioRest.redirectCall — evita
   *  doble redirect en caso de race entre múltiples response.done. */
  handoffTransferred: boolean;
}
