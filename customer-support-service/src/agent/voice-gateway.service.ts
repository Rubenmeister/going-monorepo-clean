import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import {
  OpenAIRealtimeAdapter,
  RealtimeSession,
  RealtimeVoice,
} from '../infrastructure/openai-realtime.adapter';
import { ConversationService, AgentGender, Priority } from './conversation.service';
import { VoiceName } from '../infrastructure/voice.service';
import {
  detectCanton,
  getSystemPrompt,
  SupportedLang,
} from '../knowledge-base/system-prompt';
import { VOICE_TOOLS, executeGetQuote } from './voice-tools';

/**
 * Mapeo del personaje Going (voz Chirp 3 HD usada en TTS asíncrona del path
 * de WhatsApp/Telegram texto) → voz de OpenAI Realtime usada en llamadas
 * full-duplex.
 *
 * Decisión de mapping:
 *   Kore     (femenina cálida)    → shimmer (clear, warm female)
 *   Despina  (femenina pro)        → sage    (calm, professional female)
 *   Charon   (masculina clara)     → verse   (clear adult male)
 *   Algenib  (masculina profunda)  → echo    (lower-pitched male)
 *
 * Si el día de mañana OpenAI agrega más voces (marin/cedar) o cambia el set,
 * actualizar solo esta tabla. El resto del código no depende del mapping.
 */
const GOING_TO_REALTIME_VOICE: Record<VoiceName, RealtimeVoice> = {
  Kore:    'shimmer',
  Despina: 'sage',
  Charon:  'verse',
  Algenib: 'echo',
};

/**
 * Default si la conversación no tiene `voicePreference` set (caso típico
 * — la mayoría de usuarios usa la default por género).
 */
const DEFAULT_REALTIME_VOICE: Record<AgentGender, RealtimeVoice> = {
  female: 'shimmer', // mapea a Kore
  male:   'verse',   // mapea a Charon
};

export interface StartVoiceCallOpts {
  userId: string;
  channel: 'whatsapp' | 'telegram' | 'web' | 'twilio';
  /** Idioma de la conversación. Si no se pasa, default 'es'. */
  lang?: SupportedLang;
  /**
   * Idioma para el transcript Whisper-1 del input. ISO-639-1. Si no se pasa,
   * Whisper autodetecta (más lento). Recomendado pasar siempre.
   */
  inputTranscriptionLanguage?: string;
}

export interface ActiveVoiceCall {
  userId: string;
  session: RealtimeSession;
  startedAt: Date;
  channel: StartVoiceCallOpts['channel'];
}

/**
 * Orquestador de llamadas de voz. Una instancia maneja N llamadas activas
 * (una por userId). Para cada llamada:
 *
 *   1. Determina la voz Realtime a usar (gender + voicePreference override).
 *   2. Construye instructions con el mismo system prompt que el path de texto
 *      (consistencia de personalidad entre canales).
 *   3. Inyecta los `VOICE_TOOLS` (get_quote, request_handoff por ahora).
 *   4. Crea una RealtimeSession con el adapter y wiring de eventos:
 *      - input.transcript.done → persistir como mensaje 'user'
 *      - text.done            → persistir como mensaje 'assistant'
 *      - tool.call            → dispatcher local + sendToolResult
 *      - error                → log + emitir hacia el caller del gateway
 *      - closed               → cleanup de sesiones activas
 *   5. Devuelve la sesión al caller (channel-adapter) que la usa para:
 *      - escuchar 'audio.delta' y mandar al canal de salida
 *      - llamar a `session.sendAudio(chunk)` con audio del cliente
 *
 * El gateway NO conoce los detalles del canal (WhatsApp/Telegram/Twilio).
 * Los channel-adapters viven en `api/*` y consumen este gateway.
 */
@Injectable()
export class VoiceGatewayService implements OnModuleDestroy {
  private readonly logger = new Logger(VoiceGatewayService.name);
  private readonly activeCalls = new Map<string, ActiveVoiceCall>();

  constructor(
    private readonly realtimeAdapter: OpenAIRealtimeAdapter,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * Inicia una llamada de voz. Devuelve la sesión ya conectada (session.ready
   * disparado). El caller debe attachar `audio.delta` listeners antes de
   * llamar a `session.sendAudio` con el audio del cliente.
   *
   * Si ya hay una llamada activa para el mismo userId, la cierra primero
   * — política conservadora para evitar leak de sesiones por reconexiones
   * del canal.
   */
  async startCall(opts: StartVoiceCallOpts): Promise<RealtimeSession> {
    if (!this.realtimeAdapter.isConfigured()) {
      throw new Error('VoiceGateway: OpenAIRealtimeAdapter no configurado (falta OPENAI_API_KEY)');
    }

    // Si ya había una llamada activa para este userId, ciérrala antes de
    // abrir una nueva. Evita doble facturación si el canal reconecta.
    const existing = this.activeCalls.get(opts.userId);
    if (existing) {
      this.logger.warn(`[voice] reemplazando call activa para ${opts.userId} (${existing.channel} → ${opts.channel})`);
      existing.session.close();
      this.activeCalls.delete(opts.userId);
    }

    const conv = await this.conversationService.getOrCreate(opts.userId, opts.channel === 'twilio' ? 'web' : opts.channel);
    const lang: SupportedLang = opts.lang ?? 'es';
    const voice = this.resolveVoice(conv.agentGender, conv.voicePreference);

    // System prompt — mismo helper que AgentService usa en path texto.
    // No detectamos canton acá (no hay mensaje todavía); el modelo lo
    // inferirá del audio del cliente. Lo pasamos null.
    const instructions = getSystemPrompt(lang, null, conv.agentGender);

    const session = this.realtimeAdapter.createSession({
      voice,
      instructions,
      tools: VOICE_TOOLS,
      // server_vad por default — OpenAI detecta cuándo el cliente terminó
      // de hablar y dispara response automáticamente. Latencia ~300ms tras
      // silencio. Para push-to-talk en mobile usaríamos turnDetection: null.
      turnDetection: {
        type:                'server_vad',
        threshold:           0.5,
        prefixPaddingMs:     300,
        silenceDurationMs:   500,
      },
      // Customer support → temperatura conservadora.
      temperature: 0.65,
      inputTranscriptionLanguage: opts.inputTranscriptionLanguage ?? lang,
    });

    this.wireSessionEvents(opts.userId, session);

    await session.connect();
    this.activeCalls.set(opts.userId, {
      userId:    opts.userId,
      session,
      startedAt: new Date(),
      channel:   opts.channel,
    });

    this.logger.log(`[voice] call iniciada userId=${opts.userId} channel=${opts.channel} voice=${voice} lang=${lang}`);
    return session;
  }

  /**
   * Cierra una llamada activa. Idempotente.
   */
  async endCall(userId: string): Promise<void> {
    const call = this.activeCalls.get(userId);
    if (!call) return;
    const durationMs = Date.now() - call.startedAt.getTime();
    this.logger.log(`[voice] call cerrada userId=${userId} duración=${Math.round(durationMs / 1000)}s`);
    call.session.close();
    this.activeCalls.delete(userId);
  }

  /**
   * Devuelve la sesión activa de un userId, si existe. Útil para que el
   * channel-adapter mande audio entrante sin tener que mantener el handle.
   */
  getActiveCall(userId: string): ActiveVoiceCall | undefined {
    return this.activeCalls.get(userId);
  }

  activeCallCount(): number {
    return this.activeCalls.size;
  }

  /** Cierra todas las sesiones — llamado en shutdown de NestJS. */
  async onModuleDestroy(): Promise<void> {
    if (this.activeCalls.size === 0) return;
    this.logger.log(`[voice] cerrando ${this.activeCalls.size} call(s) activa(s) por shutdown`);
    for (const call of this.activeCalls.values()) {
      try {
        call.session.close();
      } catch (err) {
        this.logger.warn(`[voice] error cerrando call ${call.userId}: ${(err as Error).message}`);
      }
    }
    this.activeCalls.clear();
  }

  // ─────────────────────────────────────────────────────────────────
  // Internals
  // ─────────────────────────────────────────────────────────────────

  private resolveVoice(gender: AgentGender, preference?: VoiceName): RealtimeVoice {
    if (preference && GOING_TO_REALTIME_VOICE[preference]) {
      return GOING_TO_REALTIME_VOICE[preference];
    }
    return DEFAULT_REALTIME_VOICE[gender];
  }

  /**
   * Wireado de eventos del session → side-effects internos del gateway
   * (persistencia, tool dispatch, cleanup). Los eventos de audio quedan
   * para el channel-adapter (que se subscribe externamente).
   */
  private wireSessionEvents(userId: string, session: RealtimeSession): void {
    session.on('input.transcript.done', (text: string) => {
      if (!text || text.trim().length === 0) return;
      this.conversationService.addMessage(userId, 'user', text.trim()).catch(err =>
        this.logger.warn(`[voice] error guardando transcript user: ${err.message}`),
      );
    });

    session.on('text.done', (text: string) => {
      if (!text || text.trim().length === 0) return;
      this.conversationService.addMessage(userId, 'assistant', text.trim()).catch(err =>
        this.logger.warn(`[voice] error guardando transcript assistant: ${err.message}`),
      );
    });

    session.on('tool.call', async ({ callId, name, argumentsJson }) => {
      const t0 = Date.now();
      let result: unknown;
      try {
        const args = JSON.parse(argumentsJson || '{}');
        result = await this.dispatchTool(userId, name, args);
      } catch (err) {
        this.logger.error(`[voice:tool:${name}] error: ${(err as Error).message}`);
        result = { ok: false, error: 'tool_execution_failed', message: (err as Error).message };
      }
      try {
        session.sendToolResult(callId, JSON.stringify(result));
        const dt = Date.now() - t0;
        this.logger.log(`[voice:tool:${name}] dt=${dt}ms userId=${userId}`);
      } catch (err) {
        this.logger.error(`[voice:tool:${name}] error mandando result: ${(err as Error).message}`);
      }
    });

    session.on('error', (err) => {
      this.logger.error(`[voice:realtime-error] userId=${userId} code=${err.code} msg=${err.message}`);
    });

    session.on('closed', (info) => {
      this.logger.log(`[voice:closed] userId=${userId} code=${info.code} clean=${info.clean} reason=${info.reason}`);
      // Self-cleanup — si la sesión se cerró por el lado del server (timeout,
      // error fatal), removemos del registry. close() llamado desde endCall()
      // también dispara este evento, pero el delete ya pasó allá; este es no-op.
      this.activeCalls.delete(userId);
    });
  }

  /**
   * Router de tool calls del modelo. Cada tool devuelve un objeto plano
   * serializable que se manda como `tool_result`.
   */
  private async dispatchTool(userId: string, name: string, args: any): Promise<unknown> {
    switch (name) {
      case 'get_quote':
        return executeGetQuote(args);

      case 'request_handoff': {
        const reason = String(args?.reason || 'Solicitud de escalación durante llamada de voz');
        const priority = ((args?.priority as Priority) || 'NORMAL') as Priority;
        await this.conversationService.requestHandoff(userId, reason, priority);
        return {
          ok: true,
          message:
            'Escalación creada. Avisa al cliente que un agente Going se conectará en breve y despídete brevemente.',
          priority,
        };
      }

      default:
        this.logger.warn(`[voice:tool] desconocido: ${name}`);
        return { ok: false, error: 'unknown_tool', message: `Tool ${name} no implementado.` };
    }
  }
}
