import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

/**
 * GeminiLiveAdapter — cliente del Live API de Gemini para INTERPRETACIÓN de voz
 * en tiempo real (voz↔voz). Análogo a OpenAIRealtimeAdapter, pero el modelo
 * `gemini-3.5-live-translate-preview` traduce el audio de entrada al idioma
 * destino y devuelve audio hablado.
 *
 * Formatos: ENTRADA PCM16 16kHz, SALIDA PCM16 24kHz (ver audio-codec.ts para la
 * conversión desde/hacia μ-law 8kHz de Twilio).
 *
 * Auth: GEMINI_API_KEY (AI Studio). El Live API hoy vive en generativelanguage
 * (no en Vertex), así que usa la key, no el token de la SA.
 *
 * Prototipo validado (1-jul): setup ~0.5s, TTFB primer audio ~2.4s, streaming.
 */

const LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const LANG_LABEL: Record<string, string> = {
  es: 'Spanish', en: 'English', fr: 'French', de: 'German', qu: 'Kichwa', pt: 'Portuguese',
};

export interface InterpreterSessionOptions {
  /** Idioma que habla la persona (código, p.ej. 'es'). Informativo para el prompt. */
  sourceLang: string;
  /** Idioma al que se traduce el audio de salida (p.ej. 'en'). */
  targetLang: string;
  /** Audio traducido (PCM16 24kHz) listo para convertir a Twilio. */
  onAudio: (pcm24k: Buffer) => void;
  onInputTranscript?: (text: string) => void;
  onOutputTranscript?: (text: string) => void;
  onReady?: () => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
}

export class GeminiInterpreterSession {
  private ws: WebSocket | null = null;
  private ready = false;
  private closed = false;
  private readonly pending: string[] = [];

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly opts: InterpreterSessionOptions,
    private readonly logger: Logger,
  ) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${LIVE_WS_URL}?key=${this.apiKey}`);
      this.ws = ws;
      let settled = false;

      ws.on('open', () => {
        const src = LANG_LABEL[this.opts.sourceLang] || this.opts.sourceLang;
        const tgt = LANG_LABEL[this.opts.targetLang] || this.opts.targetLang;
        ws.send(JSON.stringify({
          setup: {
            model: this.model,
            generationConfig: { responseModalities: ['AUDIO'] },
            systemInstruction: {
              parts: [{ text: `You are a real-time interpreter for Going App phone calls. The speaker talks in ${src}. Interpret everything faithfully into natural spoken ${tgt}. Do not add commentary; only interpret.` }],
            },
          },
        }));
      });

      ws.on('message', (raw: WebSocket.RawData) => {
        let msg: any;
        try { msg = JSON.parse(raw.toString('utf8')); } catch { return; }

        if (msg.setupComplete) {
          this.ready = true;
          for (const p of this.pending) { try { ws.send(p); } catch { /* noop */ } }
          this.pending.length = 0;
          this.opts.onReady?.();
          if (!settled) { settled = true; resolve(); }
          return;
        }
        for (const part of (msg.serverContent?.modelTurn?.parts || [])) {
          if (part.inlineData?.data) this.opts.onAudio(Buffer.from(part.inlineData.data, 'base64'));
        }
        const it = msg.serverContent?.inputTranscription?.text;
        const ot = msg.serverContent?.outputTranscription?.text;
        if (it) this.opts.onInputTranscript?.(it);
        if (ot) this.opts.onOutputTranscript?.(ot);
        if (msg.error) this.opts.onError?.(new Error(JSON.stringify(msg.error).slice(0, 200)));
      });

      ws.on('error', (err) => {
        this.opts.onError?.(err as Error);
        if (!settled) { settled = true; reject(err); }
      });
      ws.on('close', () => { this.closed = true; this.opts.onClose?.(); });

      // Timeout de conexión — si no hay setupComplete en 10s, fallar.
      setTimeout(() => { if (!settled) { settled = true; reject(new Error('Gemini Live setup timeout')); } }, 10_000);
    });
  }

  /** Envía un chunk de audio del hablante (PCM16 16kHz). */
  sendAudio(pcm16k: Buffer): void {
    if (this.closed || !this.ws) return;
    const frame = JSON.stringify({
      realtimeInput: { audio: { data: pcm16k.toString('base64'), mimeType: 'audio/pcm;rate=16000' } },
    });
    if (!this.ready) { this.pending.push(frame); return; }
    try { this.ws.send(frame); } catch (e) { this.logger.warn(`[gemini-live] sendAudio fallo: ${(e as Error).message}`); }
  }

  close(): void {
    this.closed = true;
    try { this.ws?.close(); } catch { /* noop */ }
    this.ws = null;
  }
}

@Injectable()
export class GeminiLiveAdapter {
  private readonly logger = new Logger(GeminiLiveAdapter.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GEMINI_API_KEY') || '';
    this.model = config.get<string>('GEMINI_LIVE_MODEL') || 'models/gemini-3.5-live-translate-preview';
    if (this.apiKey) this.logger.log(`[gemini-live] adaptador listo (model=${this.model})`);
    else this.logger.warn('[gemini-live] GEMINI_API_KEY no configurada — intérprete deshabilitado');
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  createInterpreterSession(opts: InterpreterSessionOptions): GeminiInterpreterSession {
    return new GeminiInterpreterSession(this.apiKey, this.model, opts, this.logger);
  }
}
