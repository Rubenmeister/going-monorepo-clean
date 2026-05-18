import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DecisionEntity, DecisionDocument, DecisionStatus } from '../schemas/decision.schema';

@Injectable()
export class DecisionRepository {
  private readonly logger = new Logger(DecisionRepository.name);

  constructor(
    @InjectModel('Decision') private readonly model: Model<DecisionDocument>,
  ) {}

  /**
   * Crea una decisión nueva. Si la intentionId ya existe (race con otra
   * instancia de Cloud Run despachando el mismo poll), captura E11000
   * duplicate key y devuelve la decisión ya persistida — así el flujo
   * sigue siendo idempotente sin importar cuántas instancias polleen.
   *
   * @throws Si el error NO es duplicate key, lo propaga.
   */
  async create(d: Partial<DecisionEntity>): Promise<DecisionDocument> {
    try {
      return await this.model.create({ ...d });
    } catch (err: any) {
      // MongoDB duplicate key code = 11000. La key conflictiva puede ser
      // intentionId (race) o decisionId (UUID colision — astronómicamente
      // improbable). En ambos casos, re-fetch y devolver.
      if (err?.code === 11000 && d.intentionId) {
        this.logger.warn(
          `Duplicate intentionId ${d.intentionId.slice(0, 8)} en create — race con otra instancia. Devolviendo existente.`,
        );
        const existing = await this.model.findOne({ intentionId: d.intentionId });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async findById(decisionId: string): Promise<DecisionEntity | null> {
    return this.model.findOne({ decisionId }).lean();
  }

  /** ¿Ya hay una decisión para esta intentionId? Idempotencia del poller. */
  async findByIntentionId(intentionId: string): Promise<DecisionEntity | null> {
    return this.model.findOne({ intentionId }).lean();
  }

  async updateStatus(
    decisionId: string,
    status: DecisionStatus,
    extras: Partial<DecisionEntity> = {},
  ): Promise<void> {
    await this.model.updateOne({ decisionId }, { $set: { status, ...extras } });
  }

  /** Decisiones esperando ack humano (Cat 3) que aún no expiraron. */
  async pendingApprovals(): Promise<DecisionEntity[]> {
    const now = new Date();
    return this.model
      .find({ status: 'pending_approval', expiresAt: { $gt: now } })
      .sort({ createdReceivedAt: -1 })
      .limit(50)
      .lean();
  }

  /** Cierra como expired las que pasaron el deadline. Usado por cleanup cron. */
  async expirePastApprovals(now: Date = new Date()): Promise<number> {
    const result = await this.model.updateMany(
      { status: 'pending_approval', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } },
    );
    return result.modifiedCount ?? 0;
  }

  /** Histórico para /orchestrator/decisions endpoint. */
  async recent(limit = 50, status?: DecisionStatus): Promise<DecisionEntity[]> {
    const filter = status ? { status } : {};
    return this.model
      .find(filter)
      .sort({ createdReceivedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Stats agregadas — útil para dashboard. */
  async statsByStatus(sinceHours = 24): Promise<Record<string, number>> {
    const since = new Date(Date.now() - sinceHours * 3600 * 1000);
    const groups = await this.model.aggregate([
      { $match: { createdReceivedAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const out: Record<string, number> = {};
    for (const g of groups) out[g._id] = g.count;
    return out;
  }
}
