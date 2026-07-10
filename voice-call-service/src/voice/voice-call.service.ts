import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { VoiceCallRepository } from '../infrastructure/persistence/voice-call.repository';
import { CerebroPublisherService } from './cerebro-publisher.service';
import type { VoiceCallEntity } from '../infrastructure/schemas/voice-call.schema';

/**
 * VoiceCallService — orquestador del lifecycle de una llamada.
 *
 * Es el punto único donde se centralizan las transiciones de estado y los
 * side effects (persist + publicar al cerebro). Los controllers (TwilioController,
 * VoiceCommandController) llaman a este service — no tocan repo/publisher
 * directo. Garantiza que CADA cambio de estado emite el evento correspondiente
 * al cerebro (Pacha).
 *
 * STUB: la integración real con Twilio Media Streams + OpenAI Realtime queda
 * en `twilio/twilio-media-stream.gateway.ts` (también stub por ahora). Este
 * service solo persiste y publica — cuando el gateway esté implementado,
 * lo llamará desde los handlers de los media stream events.
 */
@Injectable()
export class VoiceCallService {
  private readonly logger = new Logger(VoiceCallService.name);

  constructor(
    private readonly repo: VoiceCallRepository,
    private readonly cerebro: CerebroPublisherService,
  ) {}

  /**
   * Registra una llamada entrante (POST /twilio/voice-webhook).
   * Devuelve la entidad creada con runId para que el caller la use en
   * los siguientes turnos / al cerrar.
   */
  async onCallInitiated(input: {
    callId:    string;
    from:      string;
    to:        string;
  }): Promise<VoiceCallEntity & { runId: string }> {
    const startedAt = new Date();
    const runId = uuidv4();
    const created = await this.repo.createFromTwilioWebhook({
      ...input,
      startedAt,
    });
    // Update con runId (separado del create para mantener la idempotencia
    // del create — si Twilio reintenta, no perdemos el runId original).
    await this.repo.updateStatus(input.callId, 'initiated', { runId });
    this.logger.log(`[call-initiated] callId=${input.callId} from=${input.from} runId=${runId.slice(0, 8)}`);

    // Evento al cerebro: indica que arrancó una llamada. Pacha lo suma al
    // world model (volumen de llamadas/hora, distribución horaria, etc.).
    // Fire-and-forget — si falla, log warn pero no rompemos el flujo crítico.
    this.cerebro.publishCallStarted({
      runId,
      callId: input.callId,
      from:   input.from,
      startedAt: startedAt.toISOString(),
    }).catch((e) =>
      this.logger.warn(`[call-initiated] cerebro publish fallido: ${(e as Error).message}`),
    );

    return { ...created.toObject(), runId };
  }

  /**
   * Marca la llamada como en progreso tras el primer turno AI exitoso.
   * (Diferente de 'initiated' que es solo "Twilio nos avisó que llamaron",
   * esto es "el AI ya respondió, estamos conversando".)
   */
  async onCallAnswered(callId: string): Promise<void> {
    await this.repo.updateStatus(callId, 'answered', { answeredAt: new Date() });
    this.logger.log(`[call-answered] callId=${callId}`);
  }

  /**
   * Cierra la llamada con outcome + análisis. Publica al cerebro un evento
   * descriptivo que mycortex puede usar para razonar (rate de abandonment,
   * rate de escalación, sentiment promedio, intents detectados, etc.).
   */
  async onCallEnded(
    callId: string,
    closure: {
      outcome:           VoiceCallEntity['outcome'];
      escalationReason?: string;
      transcript?:       VoiceCallEntity['transcript'];
      intentDetected?:   string;
      sentimentScore?:   number;
    },
  ): Promise<VoiceCallEntity | null> {
    const closed = await this.repo.closeCall(callId, closure);
    if (!closed) return null;

    this.logger.log(
      `[call-ended] callId=${callId} outcome=${closure.outcome} ` +
      `duration=${closed.durationSeconds}s intent=${closure.intentDetected ?? 'unknown'}`,
    );

    // Eventos diferenciados por outcome — facilita que el cerebro tenga
    // métricas finas (no solo "una llamada terminó" sino "una llamada se
    // escaló" o "una llamada se abandonó").
    const runId = closed.runId ?? uuidv4();
    this.cerebro.publishCallEnded({
      runId,
      callId,
      outcome:        closure.outcome ?? 'failed_technical',
      durationSeconds: closed.durationSeconds ?? 0,
      intentDetected: closure.intentDetected,
      sentimentScore: closure.sentimentScore,
      escalationReason: closure.escalationReason,
    }).catch((e) =>
      this.logger.warn(`[call-ended] cerebro publish fallido: ${(e as Error).message}`),
    );

    return closed;
  }

  /**
   * Detección de patrón sospechoso (mismo número llama 5+ veces en 15 min).
   * Llamado idealmente desde un guard al inicio del webhook — si retorna true,
   * el caller puede decidir block (no contestar) o downgrade (queue larga).
   *
   * Threshold: 5 calls / 15 min. Configurable via env.
   */
  async isSuspiciousCaller(from: string): Promise<boolean> {
    const windowMs = parseInt(process.env.VOICE_SPAM_WINDOW_MS ?? '900000', 10); // 15min
    const threshold = parseInt(process.env.VOICE_SPAM_THRESHOLD ?? '5', 10);
    const recent = await this.repo.findByCallerSince(from, windowMs);
    if (recent.length >= threshold) {
      this.logger.warn(`[suspicious-caller] ${from}: ${recent.length} calls en ${windowMs / 1000}s`);
      // Publicar al cerebro para que mycortex razone y orchestrator decida
      // (block via Twilio, alertar a ops, etc.)
      this.cerebro.publishSuspiciousPattern({
        runId: uuidv4(),
        from,
        callsInWindow: recent.length,
        windowSeconds: windowMs / 1000,
      }).catch(() => {/* best-effort */});
      return true;
    }
    return false;
  }

  /**
   * Estado actual de una llamada por callId (auditoría Bloque 2 #18): usado para
   * gate del handoff-twiml — solo servir el <Dial> al operador si la llamada
   * está realmente en curso/escalada. Null si no existe.
   */
  async findStatus(callId: string): Promise<string | null> {
    const call = await this.repo.findById(callId);
    return (call?.status as string) ?? null;
  }
}
