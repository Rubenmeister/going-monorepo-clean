import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  VoiceCallEntity,
  VoiceCallDocument,
  VoiceCallStatus,
} from '../schemas/voice-call.schema';

@Injectable()
export class VoiceCallRepository {
  private readonly logger = new Logger(VoiceCallRepository.name);

  constructor(
    @InjectModel('VoiceCall')
    private readonly model: Model<VoiceCallDocument>,
  ) {}

  /**
   * Crea el registro inicial de la llamada al recibir el webhook de Twilio.
   * Idempotente: si callId ya existe (race con retry de Twilio), devuelve
   * el existente sin duplicar.
   */
  async createFromTwilioWebhook(input: {
    callId: string;
    from:    string;
    to:      string;
    startedAt: Date;
  }): Promise<VoiceCallDocument> {
    try {
      return await this.model.create({
        ...input,
        channel: 'twilio_voice',
        status:  'initiated',
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        this.logger.warn(`Duplicate callId ${input.callId} — Twilio retry. Devolviendo existente.`);
        const existing = await this.model.findOne({ callId: input.callId });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async findById(callId: string): Promise<VoiceCallEntity | null> {
    return this.model.findOne({ callId }).lean();
  }

  async updateStatus(
    callId: string,
    status: VoiceCallStatus,
    extras: Partial<VoiceCallEntity> = {},
  ): Promise<void> {
    await this.model.updateOne({ callId }, { $set: { status, ...extras } });
  }

  /**
   * Cierra la llamada con outcome + cálculo automático de durationSeconds.
   * Idempotente: si endedAt ya está set, no la sobreescribe.
   */
  async closeCall(
    callId: string,
    closure: {
      outcome:         VoiceCallEntity['outcome'];
      escalationReason?: string;
      transcript?:      VoiceCallEntity['transcript'];
      intentDetected?:  string;
      sentimentScore?:  number;
      runId?:           string;
    },
  ): Promise<VoiceCallEntity | null> {
    const existing = await this.model.findOne({ callId });
    if (!existing) {
      this.logger.warn(`closeCall: callId ${callId} no encontrado`);
      return null;
    }
    if (existing.endedAt) {
      this.logger.debug(`closeCall: callId ${callId} ya cerrada (endedAt=${existing.endedAt.toISOString()})`);
      return existing.toObject();
    }
    const endedAt = new Date();
    const durationSeconds = Math.round((endedAt.getTime() - existing.startedAt.getTime()) / 1000);
    const status: VoiceCallStatus =
      closure.outcome === 'abandoned_by_caller' ? 'abandoned' :
      closure.outcome === 'escalated' ? 'escalated_to_human' :
      closure.outcome === 'failed_technical' ? 'failed' :
      'completed';
    const updated = await this.model
      .findOneAndUpdate(
        { callId },
        { $set: { status, endedAt, durationSeconds, ...closure } },
        { new: true },
      )
      .lean();
    return updated;
  }

  /** Llamadas activas (operador ve "qué está pasando ahora"). */
  async listActive(limit = 50): Promise<VoiceCallEntity[]> {
    return this.model
      .find({ status: { $in: ['initiated', 'answered', 'in_progress'] } })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Histórico paginado para /admin/cerebro/voice-calls. */
  async recent(limit = 50, status?: VoiceCallStatus): Promise<VoiceCallEntity[]> {
    // Saneo anti NoSQL-injection (auditoría Bloque 2): solo un status string va
    // al filtro; un objeto (?status[$ne]=) se descarta. El endpoint ya es
    // admin-gated (#12), esto es defensa en profundidad.
    const filter = typeof status === 'string' ? { status } : {};
    return this.model.find(filter).sort({ startedAt: -1 }).limit(limit).lean();
  }

  /** Stats agregadas por outcome últimas N horas (para mycortex / dashboard). */
  async statsByOutcome(sinceHours = 24): Promise<Record<string, number>> {
    const since = new Date(Date.now() - sinceHours * 3600 * 1000);
    const groups = await this.model.aggregate([
      { $match: { createdReceivedAt: { $gte: since } } },
      { $group: { _id: '$outcome', count: { $sum: 1 } } },
    ]);
    const out: Record<string, number> = {};
    for (const g of groups) {
      if (g._id) out[g._id] = g.count;
    }
    return out;
  }

  /**
   * Llamadas del mismo `from` en una ventana de tiempo.
   * Útil para detectar fraud / spam (mismo número llama N+ veces en T min).
   */
  async findByCallerSince(from: string, sinceMs: number): Promise<VoiceCallEntity[]> {
    const since = new Date(Date.now() - sinceMs);
    return this.model
      .find({ from, startedAt: { $gte: since } })
      .sort({ startedAt: -1 })
      .lean();
  }
}
