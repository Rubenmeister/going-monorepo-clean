import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * VoiceCall — registro de una llamada telefónica atendida por Uyari.
 *
 * Lifecycle:
 *   initiated → answered → in_progress → completed
 *                                      ↘ abandoned (cliente colgó)
 *                                      ↘ escalated_to_human (handoff)
 *                                      ↘ failed (error técnico)
 *
 * Campos clave para análisis posterior (mycortex razona sobre estos):
 *  - duration: detecta llamadas muy cortas (insatisfacción) o muy largas
 *    (caso complejo no resuelto por AI)
 *  - outcome: tasa éxito vs escalación
 *  - sentimentScore: -1 (negativo) a +1 (positivo) — derivado del transcript
 *  - intentDetected: clasificación del propósito de la llamada
 *  - escalationReason: por qué se mandó a humano (si aplica)
 *
 * TTL: 1 año para auditoría + análisis. Los transcripts son PII (LOPD) — la
 * política de retención puede requerir reducir a 90d si ops audit lo pide.
 */

export type VoiceCallStatus =
  | 'initiated'           // Twilio webhook recibido, AI conectando
  | 'answered'            // AI inicial completada el primer turno
  | 'in_progress'         // conversación activa
  | 'completed'           // cierre normal
  | 'abandoned'           // cliente colgó antes de respuesta
  | 'escalated_to_human'  // handoff a operador humano (out-of-band)
  | 'failed';             // error técnico (Twilio down, OpenAI rate-limit, etc.)

export type VoiceCallChannel = 'twilio_voice';

@Schema({ collection: 'voice_calls', timestamps: true })
export class VoiceCallEntity {
  @Prop({ required: true, unique: true, type: String, index: true })
  callId!: string;                  // CallSid de Twilio (único globalmente)

  @Prop({ required: true, type: String, index: true })
  from!: string;                    // E.164 ej. "+593984037949"

  @Prop({ required: true, type: String })
  to!: string;                      // E.164 del número Going App

  @Prop({ required: true, type: String, default: 'twilio_voice' })
  channel!: VoiceCallChannel;

  @Prop({ required: true, type: String, index: true, default: 'initiated' })
  status!: VoiceCallStatus;

  // ── Timestamps del lifecycle ─────────────────────────
  @Prop({ required: true, type: Date })
  startedAt!: Date;

  @Prop({ type: Date })
  answeredAt?: Date;                // primer audio out de AI

  @Prop({ type: Date })
  endedAt?: Date;

  @Prop({ type: Number })
  durationSeconds?: number;         // endedAt - startedAt

  // ── Contenido de la llamada (PII — manejar con cuidado) ──
  /**
   * Transcript estructurado por turnos: [{role: 'user'|'assistant', text, t}].
   * Solo se persiste si VOICE_CALL_STORE_TRANSCRIPT=true (default true).
   * Para apagar storage de transcripts por LOPD: setear a false.
   */
  @Prop({ type: Array })
  transcript?: Array<{
    role: 'user' | 'assistant';
    text: string;
    t:    number;                   // segundos desde startedAt
  }>;

  /**
   * Intent detectado por el AI durante la llamada (booking, complaint,
   * info, support, etc.). NULL si no se clasificó (llamada muy corta o
   * conversación trivial).
   */
  @Prop({ type: String, index: true })
  intentDetected?: string;

  /**
   * Sentiment promedio del transcript (-1 negativo, 0 neutral, +1 positivo).
   * Calculado al cierre de la llamada (analyzeSentiment job o inline).
   * Útil para detectar burst de calls con sentiment negativo → alerta ops.
   */
  @Prop({ type: Number })
  sentimentScore?: number;

  // ── Outcome ────────────────────────────────────────────
  /**
   * 'resolved_by_ai'           — AI cerró la consulta sin escalar
   * 'escalated'                — handoff a humano (cliente lo pidió o regla)
   * 'abandoned_by_caller'      — cliente colgó
   * 'failed_technical'         — error técnico (audio cortado, OpenAI down)
   */
  @Prop({ type: String, index: true })
  outcome?: 'resolved_by_ai' | 'escalated' | 'abandoned_by_caller' | 'failed_technical';

  @Prop({ type: String })
  escalationReason?: string;        // si outcome=escalated

  // ── Recording (opcional, off por default por LOPD) ──
  /**
   * URL GCS del audio crudo de la llamada, si VOICE_CALL_RECORD_AUDIO=true.
   * Default: false (no grabamos audio — solo el transcript). Activable
   * temporalmente para debugging de casos específicos.
   */
  @Prop({ type: String })
  recordingUrl?: string;

  // ── Tracing para correlación con cerebro ──
  /**
   * runId que se publica al evento agent.voice-call.events del cerebro.
   * Permite correlacionar "esta llamada" con el WorldSnapshot que Pacha
   * armó cuando Yachay razonó sobre ella.
   */
  @Prop({ type: String, index: true })
  runId?: string;

  // TTL 365d (1 año) — auditoría + análisis. Reducir a 90d si ops lo pide.
  @Prop({ type: Date, default: () => new Date(), index: true, expires: '365d' })
  createdReceivedAt!: Date;
}

export type VoiceCallDocument = VoiceCallEntity & Document;
export const VoiceCallSchema = SchemaFactory.createForClass(VoiceCallEntity);

// Índices compuestos para queries frecuentes:
//  - Estado actual de llamadas (operador ve "qué está pasando ahora")
VoiceCallSchema.index({ status: 1, startedAt: -1 });
//  - Stats por outcome × día (dashboard)
VoiceCallSchema.index({ outcome: 1, createdReceivedAt: -1 });
//  - Calls del mismo número (detección de patrones / repeated callers)
VoiceCallSchema.index({ from: 1, startedAt: -1 });
