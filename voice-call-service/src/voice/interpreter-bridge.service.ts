import { Injectable, Logger } from '@nestjs/common';
import { GeminiLiveAdapter, GeminiInterpreterSession } from '../realtime/gemini-live.adapter';
import { VoiceCallService } from './voice-call.service';
import { twilioFrameToGemini, geminiPcmToTwilioFrame } from '../twilio/audio-codec';

/**
 * InterpreterBridgeService — puente Twilio Media Stream ↔ Gemini Live Translate.
 *
 * Análogo a RealtimeBridgeService pero para el MODO INTÉRPRETE: quien llama
 * habla en `sourceLang` y escucha la traducción en `targetLang`. NO usa OpenAI
 * ni tools — solo interpreta voz→voz.
 *
 * Audio: Twilio μ-law 8kHz → twilioFrameToGemini (PCM16 16kHz) → Gemini;
 * Gemini PCM16 24kHz → geminiPcmToTwilioFrame (μ-law 8kHz) → Twilio.
 *
 * 1 sesión por streamSid. MVP unidireccional (una persona). La conferencia de
 * 2 personas (conductor↔pasajero, ambos sentidos) es la fase siguiente.
 */
@Injectable()
export class InterpreterBridgeService {
  private readonly logger = new Logger(InterpreterBridgeService.name);
  private readonly sessions = new Map<string, { session: GeminiInterpreterSession; callId: string; startedAt: number }>();

  constructor(
    private readonly adapter: GeminiLiveAdapter,
    private readonly voice: VoiceCallService,
  ) {}

  isConfigured(): boolean {
    return this.adapter.isConfigured();
  }

  async startInterpreterSession(input: {
    streamSid: string;
    callId: string;
    from?: string;
    sourceLang: string;
    targetLang: string;
    sendAudioBack: (mulawB64: string) => boolean;
  }): Promise<boolean> {
    if (!this.adapter.isConfigured()) {
      this.logger.error(`[interpreter] Gemini no configurado — no puedo atender call ${input.callId}`);
      return false;
    }
    if (this.sessions.has(input.streamSid)) return true;

    const session = this.adapter.createInterpreterSession({
      sourceLang: input.sourceLang,
      targetLang: input.targetLang,
      onAudio: (pcm24k) => { input.sendAudioBack(geminiPcmToTwilioFrame(pcm24k)); },
      onInputTranscript: (t) => this.logger.debug(`[interpreter] escuchó: ${t.slice(0, 60)}`),
      onOutputTranscript: (t) => this.logger.debug(`[interpreter] tradujo: ${t.slice(0, 60)}`),
      onError: (e) => this.logger.error(`[interpreter] error callId=${input.callId}: ${e.message}`),
      onClose: () => this.logger.log(`[interpreter] Gemini WS cerrado callId=${input.callId}`),
    });

    try {
      await session.connect();
    } catch (e) {
      this.logger.error(`[interpreter] connect fallo callId=${input.callId}: ${(e as Error).message}`);
      return false;
    }

    this.sessions.set(input.streamSid, { session, callId: input.callId, startedAt: Date.now() });
    this.logger.log(`[interpreter] sesión lista callId=${input.callId} ${input.sourceLang}→${input.targetLang}`);
    return true;
  }

  /** Chunk de audio del hablante (Twilio μ-law 8kHz base64). */
  forwardCallerAudio(streamSid: string, mulawB64: string): void {
    const ctx = this.sessions.get(streamSid);
    if (!ctx) return;
    try {
      ctx.session.sendAudio(twilioFrameToGemini(mulawB64));
    } catch (e) {
      this.logger.warn(`[interpreter] sendAudio fallo: ${(e as Error).message}`);
    }
  }

  async endSession(streamSid: string, reason?: string): Promise<void> {
    const ctx = this.sessions.get(streamSid);
    if (!ctx) return;
    this.sessions.delete(streamSid);
    try { ctx.session.close(); } catch { /* noop */ }
    await this.voice.onCallEnded(ctx.callId, { outcome: 'resolved_by_ai' }).catch(() => {/* best-effort */});
    this.logger.log(`[interpreter] call ended callId=${ctx.callId} dur=${Math.round((Date.now() - ctx.startedAt) / 1000)}s reason=${reason ?? '-'}`);
  }
}
