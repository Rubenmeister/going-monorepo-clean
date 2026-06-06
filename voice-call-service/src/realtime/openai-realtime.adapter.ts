/**
 * ⚠️  COPIA de customer-support-service/src/infrastructure/openai-realtime.adapter.ts
 *
 * Duplicación temporal mientras el adapter se estabiliza en ambos services.
 * Cuando los 2 casos de uso (in-app voice WS + Twilio media stream) hayan
 * corrido en prod >1 mes y los cambios sean siempre paralelos, mover a
 * libs/realtime-voice/ para single source of truth.
 *
 * Mantener sincronizado a mano por ahora: si fixás un bug acá, replicalo
 * en customer-support (y viceversa). El delta natural en este service es:
 *  - inputAudioFormat/outputAudioFormat default 'g711_ulaw' (no 'pcm16')
 *    porque Twilio entrega μ-law nativo. Configuración por session, no
 *    cambio al adapter.
 *  - tools customizadas en voice-tools-phone.ts (sin UI, respuestas verbales)
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

/**
 * OpenAI Realtime API — voces disponibles para Realtime (gpt-realtime-mini).
 *
 * Distinto del set de voces Chirp 3 HD que usamos en voice.service (Kore /
 * Despina / Charon / Algenib). Aquí mapeamos manualmente los personajes
 * Going App a voces Realtime equivalentes en voice-gateway.service.ts:
 *
 *   Going App female → 'shimmer' (Kore) | 'sage'    (Despina)
 *   Going App male   → 'verse'   (Charon) | 'echo'  (Algenib)
 *
 * El mapeo final vive en VoiceGateway (Día 3); este adapter solo expone el
 * tipo y deja que el caller decida.
 */
export type RealtimeVoice =
  | 'alloy'
  | 'echo'
  | 'fable'
  | 'onyx'
  | 'nova'
  | 'shimmer'
  | 'sage'
  | 'verse'
  | 'marin'
  | 'cedar';

/**
 * Formato de audio. OpenAI Realtime acepta:
 *   - pcm16    → 24 kHz, mono, signed little-endian (default y recomendado)
 *   - g711_ulaw → 8 kHz mu-law (compat Twilio)
 *   - g711_alaw → 8 kHz a-law
 *
 * Para WhatsApp/Telegram convertimos a pcm16 antes de mandar. Para Twilio
 * Voice (si lo usamos) usaríamos g711_ulaw nativo.
 */
export type RealtimeAudioFormat = 'pcm16' | 'g711_ulaw' | 'g711_alaw';

/**
 * Declaración de una function tool al estilo OpenAI Realtime. Mismo schema
 * que Chat Completions tool calls: `parameters` es JSON Schema.
 */
export interface RealtimeTool {
  type: 'function';
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Server-side VAD config. Cuando está activo, OpenAI detecta cuándo el
 * usuario empezó y dejó de hablar, y genera `response.create` automático
 * al `speech_stopped`. Eso elimina la necesidad de mandar commit manual.
 *
 * Si turnDetection = null → modo manual: el caller debe llamar a
 * `commitAudio()` y `createResponse()` explícitamente (útil para
 * push-to-talk en mobile).
 */
export interface ServerVadConfig {
  type: 'server_vad';
  threshold?: number;       // 0..1, default 0.5
  prefixPaddingMs?: number; // audio que se incluye antes del start, default 300
  silenceDurationMs?: number; // silencio para considerar fin, default 500
}

export interface RealtimeSessionConfig {
  voice: RealtimeVoice;
  instructions: string;
  tools?: RealtimeTool[];
  inputAudioFormat?: RealtimeAudioFormat;   // default 'pcm16'
  outputAudioFormat?: RealtimeAudioFormat;  // default 'pcm16'
  turnDetection?: ServerVadConfig | null;    // null = manual; default server_vad
  /**
   * Modalities por defecto = ['audio', 'text']. Si querés solo texto (sin
   * generar audio) pasá ['text']. Si querés solo audio (sin transcript)
   * pasá ['audio'] — aunque OpenAI siempre devuelve transcript del audio
   * generado en response.audio_transcript.*.
   */
  modalities?: Array<'audio' | 'text'>;
  /**
   * Idioma esperado para el transcript del input. ISO-639-1. Si no se pasa,
   * OpenAI autodetecta. Para mejor latencia + accuracy con Whisper, conviene
   * pasarlo cuando ya sabemos el idioma de la conversación.
   */
  inputTranscriptionLanguage?: string;
  /**
   * Temperatura del modelo. Default 0.8. Para customer support querés algo
   * más bajo (0.6-0.7) para respuestas más consistentes.
   */
  temperature?: number;
}

/**
 * Eventos que el `RealtimeSession` re-emite a sus listeners. Es un subset
 * curado de los eventos crudos de OpenAI — abstraído para que el caller
 * no tenga que conocer el wire protocol.
 */
export type RealtimeEventMap = {
  /** WebSocket abierta + session.created recibido + session.update enviado. Listo para mandar audio. */
  'session.ready':    () => void;
  /** Chunk de audio del assistant (base64 → Buffer ya decodificado). */
  'audio.delta':      (chunk: Buffer) => void;
  /** Fin de respuesta de audio. Equivale a response.audio.done. */
  'audio.done':       () => void;
  /** Texto parcial del assistant (si modalities incluye 'text' o como transcript de audio). */
  'text.delta':       (delta: string) => void;
  /** Texto completo del assistant. */
  'text.done':        (text: string) => void;
  /** Transcript parcial del input del usuario (lo que el modelo entiende que dijo). */
  'input.transcript.delta': (delta: string) => void;
  /** Transcript completo del input del usuario. Útil para guardar en Conversation.messages. */
  'input.transcript.done':  (text: string) => void;
  /** OpenAI detectó que el usuario empezó a hablar (server_vad). */
  'speech.started':   () => void;
  /** OpenAI detectó que el usuario dejó de hablar (server_vad). */
  'speech.stopped':   () => void;
  /** El modelo quiere invocar una tool. El caller debe ejecutarla y devolver el resultado con `sendToolResult`. */
  'tool.call':        (call: { callId: string; name: string; argumentsJson: string }) => void;
  /** Fin del turno completo del assistant (todos los content_parts + tool_calls). */
  'response.done':    (response: { id: string; usage?: any }) => void;
  /** Error reportado por la API (no errores de WebSocket, esos van a 'closed'). */
  'error':            (err: { code: string; message: string; type?: string }) => void;
  /** WebSocket cerrada — incluye errores fatales. */
  'closed':           (info: { code: number; reason: string; clean: boolean }) => void;
};

const REALTIME_URL = 'wss://api.openai.com/v1/realtime';
const DEFAULT_MODEL = 'gpt-realtime-mini';

/**
 * Una sesión de voz bidireccional con OpenAI Realtime API. Maneja el ciclo
 * de vida del WebSocket, codifica/decodifica eventos, y expone una API
 * tipada via EventEmitter.
 *
 * Uso típico (Día 3 — VoiceGateway):
 *
 *   const session = adapter.createSession({
 *     voice: 'shimmer',
 *     instructions: 'You are Going App customer support...',
 *     tools: [createBookingTool, escalateToHumanTool],
 *   });
 *   session.on('session.ready', () => { ... });
 *   session.on('audio.delta', (chunk) => sendToUser(chunk));
 *   session.on('tool.call', async ({ callId, name, argumentsJson }) => {
 *     const result = await runTool(name, JSON.parse(argumentsJson));
 *     session.sendToolResult(callId, JSON.stringify(result));
 *   });
 *   await session.connect();
 *   session.sendAudio(pcm16Chunk);
 */
export class RealtimeSession extends EventEmitter {
  private readonly logger = new Logger(RealtimeSession.name);
  private ws: WebSocket | null = null;
  private ready = false;
  private closed = false;
  private pendingToolCalls = new Map<string, { name: string; args: string }>();
  private currentResponseText = '';
  private currentInputTranscript = '';

  constructor(
    private readonly apiKey: string,
    private readonly config: RealtimeSessionConfig,
    private readonly model: string = DEFAULT_MODEL,
  ) {
    super();
  }

  /**
   * Abre el WebSocket y espera al `session.created`. Resuelve cuando la
   * sesión está lista para recibir audio. Rechaza si la conexión falla o
   * si OpenAI devuelve un error de auth/config.
   */
  connect(): Promise<void> {
    if (this.ws) {
      return Promise.reject(new Error('Session already connected'));
    }

    return new Promise((resolve, reject) => {
      const url = `${REALTIME_URL}?model=${encodeURIComponent(this.model)}`;
      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      });

      let resolved = false;

      this.ws.on('open', () => {
        this.logger.log(`[realtime] WS abierto → ${this.model}`);
      });

      this.ws.on('message', (raw: WebSocket.RawData) => {
        try {
          const event = JSON.parse(raw.toString());
          this.handleServerEvent(event);
          // session.created indica que la sesión existe; recién ahí mandamos
          // session.update con nuestra config y consideramos ready.
          if (event.type === 'session.created' && !resolved) {
            this.sendSessionUpdate();
            this.ready = true;
            resolved = true;
            this.emit('session.ready');
            resolve();
          }
        } catch (err) {
          this.logger.error(`[realtime] error parsing event: ${(err as Error).message}`);
        }
      });

      this.ws.on('error', (err: Error) => {
        this.logger.error(`[realtime] WS error: ${err.message}`);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });

      this.ws.on('close', (code: number, reasonBuf: Buffer) => {
        const reason = reasonBuf?.toString() || '';
        const clean = code === 1000;
        this.closed = true;
        this.ready = false;
        this.logger.log(`[realtime] WS cerrado code=${code} clean=${clean} reason=${reason}`);
        this.emit('closed', { code, reason, clean });
        if (!resolved) {
          resolved = true;
          reject(new Error(`WS closed before session.created (code=${code} reason=${reason})`));
        }
      });
    });
  }

  /**
   * Envía session.update con nuestra config. Se llama una sola vez al
   * recibir session.created.
   */
  private sendSessionUpdate(): void {
    const turnDetection =
      this.config.turnDetection === null
        ? null
        : {
            type:                'server_vad',
            threshold:           this.config.turnDetection?.threshold           ?? 0.5,
            prefix_padding_ms:   this.config.turnDetection?.prefixPaddingMs     ?? 300,
            silence_duration_ms: this.config.turnDetection?.silenceDurationMs   ?? 500,
          };

    const sessionPayload: any = {
      modalities:          this.config.modalities         ?? ['audio', 'text'],
      voice:               this.config.voice,
      instructions:        this.config.instructions,
      input_audio_format:  this.config.inputAudioFormat   ?? 'pcm16',
      output_audio_format: this.config.outputAudioFormat  ?? 'pcm16',
      turn_detection:      turnDetection,
      temperature:         this.config.temperature        ?? 0.7,
    };

    if (this.config.inputTranscriptionLanguage) {
      sessionPayload.input_audio_transcription = {
        model:    'whisper-1',
        language: this.config.inputTranscriptionLanguage,
      };
    } else {
      // Pedimos transcript siempre — lo necesitamos para guardar
      // Conversation.messages e indexar lo que dijo el usuario.
      sessionPayload.input_audio_transcription = { model: 'whisper-1' };
    }

    if (this.config.tools && this.config.tools.length > 0) {
      sessionPayload.tools       = this.config.tools;
      sessionPayload.tool_choice = 'auto';
    }

    this.sendRaw({ type: 'session.update', session: sessionPayload });
  }

  /**
   * Envía un chunk de audio del usuario al modelo. El audio debe estar en
   * el formato configurado en `inputAudioFormat` (default pcm16 24kHz mono LE).
   *
   * Si turnDetection = 'server_vad', OpenAI detectará el fin del speech
   * automáticamente y disparará una response. En modo manual, el caller
   * debe llamar a `commitAudio()` + `createResponse()` después.
   */
  sendAudio(chunk: Buffer): void {
    this.ensureReady();
    const base64 = chunk.toString('base64');
    this.sendRaw({ type: 'input_audio_buffer.append', audio: base64 });
  }

  /**
   * Manual commit del audio buffer. Solo necesario si turnDetection = null
   * (push-to-talk). En modo server_vad, OpenAI hace commit automático.
   */
  commitAudio(): void {
    this.ensureReady();
    this.sendRaw({ type: 'input_audio_buffer.commit' });
  }

  /**
   * Limpia el buffer de audio del usuario sin generar respuesta. Útil si
   * el usuario apretó cancel o se cortó la grabación.
   */
  clearAudio(): void {
    this.ensureReady();
    this.sendRaw({ type: 'input_audio_buffer.clear' });
  }

  /**
   * Dispara una response del modelo. Solo necesario en modo manual o si
   * querés forzar una response después de un tool result.
   */
  createResponse(): void {
    this.ensureReady();
    this.sendRaw({ type: 'response.create' });
  }

  /**
   * Cancela la generación en curso. Útil para "barge-in" — el usuario
   * empieza a hablar y queremos cortar el audio del assistant.
   */
  cancelResponse(): void {
    this.ensureReady();
    this.sendRaw({ type: 'response.cancel' });
  }

  /**
   * Inyecta un mensaje de texto del usuario (sin audio). Útil para
   * conversaciones mixtas (audio + texto) o para mandar contexto inicial.
   * Después de esto necesitás llamar a `createResponse()` para que el
   * modelo responda.
   */
  sendTextMessage(text: string): void {
    this.ensureReady();
    this.sendRaw({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
  }

  /**
   * Devuelve el resultado de una tool al modelo. `callId` es el id que
   * vino en el evento `tool.call`. `outputJson` debe ser un string JSON.
   *
   * Después del tool result, OpenAI continúa la response automáticamente
   * (no hace falta `createResponse()`).
   */
  sendToolResult(callId: string, outputJson: string): void {
    this.ensureReady();
    this.sendRaw({
      type: 'conversation.item.create',
      item: {
        type:    'function_call_output',
        call_id: callId,
        output:  outputJson,
      },
    });
    // Después de un tool result, hace falta disparar la response — OpenAI
    // no la genera automáticamente porque podría haber múltiples tool calls
    // en la misma response.
    this.sendRaw({ type: 'response.create' });
    this.pendingToolCalls.delete(callId);
  }

  /**
   * Cierra el WebSocket limpiamente. Idempotente.
   */
  close(): void {
    if (!this.ws || this.closed) return;
    try {
      this.ws.close(1000, 'client closing');
    } catch (err) {
      this.logger.warn(`[realtime] error closing WS: ${(err as Error).message}`);
    }
  }

  isReady(): boolean {
    return this.ready && !this.closed;
  }

  // Tipado fuerte para EventEmitter.
  on<E extends keyof RealtimeEventMap>(event: E, listener: RealtimeEventMap[E]): this {
    return super.on(event, listener as (...args: any[]) => void);
  }
  off<E extends keyof RealtimeEventMap>(event: E, listener: RealtimeEventMap[E]): this {
    return super.off(event, listener as (...args: any[]) => void);
  }
  override emit<E extends keyof RealtimeEventMap>(event: E, ...args: Parameters<RealtimeEventMap[E]>): boolean {
    return super.emit(event, ...args);
  }

  // ─────────────────────────────────────────────────────────────────
  // Internals
  // ─────────────────────────────────────────────────────────────────

  private ensureReady(): void {
    if (this.closed) throw new Error('RealtimeSession is closed');
    if (!this.ready) throw new Error('RealtimeSession not ready yet — wait for session.ready event');
  }

  private sendRaw(payload: object): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not open');
    }
    this.ws.send(JSON.stringify(payload));
  }

  /**
   * Mapea eventos crudos de OpenAI Realtime → eventos de alto nivel para
   * el caller. Documentación de eventos:
   * https://platform.openai.com/docs/api-reference/realtime-server-events
   */
  private handleServerEvent(event: any): void {
    switch (event.type) {
      case 'session.created':
      case 'session.updated':
      case 'conversation.created':
      case 'rate_limits.updated':
        // Solo log — no se exponen al caller.
        break;

      case 'input_audio_buffer.speech_started':
        this.emit('speech.started');
        break;

      case 'input_audio_buffer.speech_stopped':
        this.emit('speech.stopped');
        break;

      case 'input_audio_buffer.committed':
      case 'input_audio_buffer.cleared':
        break;

      case 'conversation.item.input_audio_transcription.delta':
        if (event.delta) {
          this.currentInputTranscript += event.delta;
          this.emit('input.transcript.delta', event.delta);
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          this.emit('input.transcript.done', event.transcript);
          this.currentInputTranscript = '';
        }
        break;

      case 'response.audio.delta':
        if (event.delta) {
          // delta viene en base64 — decodificamos a Buffer antes de emitir.
          const chunk = Buffer.from(event.delta, 'base64');
          this.emit('audio.delta', chunk);
        }
        break;

      case 'response.audio.done':
        this.emit('audio.done');
        break;

      case 'response.text.delta':
      case 'response.audio_transcript.delta':
        if (event.delta) {
          this.currentResponseText += event.delta;
          this.emit('text.delta', event.delta);
        }
        break;

      case 'response.text.done':
      case 'response.audio_transcript.done':
        if (event.text || event.transcript) {
          const full = event.text || event.transcript;
          this.emit('text.done', full);
          this.currentResponseText = '';
        }
        break;

      case 'response.function_call_arguments.delta':
        // Acumulamos los args en pendingToolCalls hasta que llegue .done.
        if (event.call_id) {
          const pending = this.pendingToolCalls.get(event.call_id) || { name: '', args: '' };
          pending.args += event.delta || '';
          this.pendingToolCalls.set(event.call_id, pending);
        }
        break;

      case 'response.function_call_arguments.done':
        if (event.call_id && event.name) {
          this.emit('tool.call', {
            callId:        event.call_id,
            name:          event.name,
            argumentsJson: event.arguments || '{}',
          });
        }
        break;

      case 'response.output_item.added':
        // Si es una function_call, registramos el name temprano para tracking.
        if (event.item?.type === 'function_call' && event.item?.call_id) {
          this.pendingToolCalls.set(event.item.call_id, {
            name: event.item.name || '',
            args: '',
          });
        }
        break;

      case 'response.done':
        this.emit('response.done', {
          id:    event.response?.id || 'unknown',
          usage: event.response?.usage,
        });
        break;

      case 'error':
        this.emit('error', {
          code:    event.error?.code    || 'unknown',
          message: event.error?.message || 'Unknown error from Realtime API',
          type:    event.error?.type,
        });
        break;

      default:
        // Eventos no manejados — log debug pero no es error.
        this.logger.debug(`[realtime] unhandled event type=${event.type}`);
        break;
    }
  }
}

/**
 * Provider de NestJS que crea sesiones de OpenAI Realtime. Stateless — toda
 * la lógica per-llamada vive en `RealtimeSession`. Este adapter solo inyecta
 * la API key y construye instancias.
 *
 * Usado por VoiceGateway (Día 3) cuando arranca una llamada de voz.
 */
@Injectable()
export class OpenAIRealtimeAdapter {
  private readonly logger = new Logger(OpenAIRealtimeAdapter.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENAI_API_KEY') || '';
    this.model  = this.config.get<string>('OPENAI_REALTIME_MODEL') || DEFAULT_MODEL;

    if (!this.apiKey) {
      this.logger.warn('OPENAI_API_KEY no configurada — RealtimeAdapter no podrá conectar');
    } else {
      this.logger.log(`[realtime-adapter] inicializado (model=${this.model})`);
    }
  }

  /**
   * Crea una nueva sesión Realtime. No conecta automáticamente — el caller
   * debe llamar a `session.connect()` y esperar el evento `session.ready`.
   */
  createSession(config: RealtimeSessionConfig): RealtimeSession {
    if (!this.apiKey) {
      throw new Error('Cannot create Realtime session — OPENAI_API_KEY missing');
    }
    return new RealtimeSession(this.apiKey, config, this.model);
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }
}
