import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IntentionEntity, IntentionDocument } from '../schemas/intention.schema';

@Injectable()
export class IntentionRepository {
  constructor(
    @InjectModel('Intention') private readonly model: Model<IntentionDocument>,
  ) {}

  async saveMany(items: Omit<IntentionEntity, 'receivedAt' | 'status' | 'outcome'>[]): Promise<IntentionDocument[]> {
    if (items.length === 0) return [];
    return this.model.insertMany(items.map(i => ({
      ...i,
      status: 'proposed',
      outcome: 'unknown',
    })));
  }

  /** Top intenciones del ciclo más reciente, ordenadas por urgency desc. */
  async recentByCycle(cycleId: string, limit = 10): Promise<IntentionEntity[]> {
    return this.model
      .find({ cycleId })
      .sort({ urgency: -1 })
      .limit(limit)
      .lean();
  }

  /** Top N intenciones globales (recientes + pendientes), ordenadas por urgency desc. */
  async topPending(limit = 20): Promise<IntentionEntity[]> {
    return this.model
      .find({ status: 'proposed' })
      .sort({ urgency: -1, receivedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Histórico para auditoría / dashboard. */
  async recent(limit = 50): Promise<IntentionEntity[]> {
    return this.model
      .find()
      .sort({ receivedAt: -1 })
      .limit(limit)
      .lean();
  }

  /** Una sola intention por intentionId — usado por dashboard drill-down. */
  async findOne(intentionId: string): Promise<IntentionEntity | null> {
    return this.model.findOne({ intentionId }).lean();
  }

  /**
   * Marca como expiradas las intenciones cuyo expiresAt ya pasó. Lo llama
   * el cron del reasoning-loop antes de generar nuevas, así no acumula
   * basura en el dashboard.
   */
  async expirePast(now: Date = new Date()): Promise<number> {
    const result = await this.model.updateMany(
      { status: 'proposed', expiresAt: { $lt: now } },
      { $set: { status: 'expired' } },
    );
    return result.modifiedCount ?? 0;
  }

  /**
   * Cierra el feedback loop: el orchestrator llama esta función después de
   * ejecutar una decisión, para que MyCortex vea el outcome en su próximo
   * ciclo de razonamiento. La intención se marca como 'executed' y se
   * setea outcome + notas + timestamp.
   *
   * Idempotente: si ya hay outcome registrado, sobrescribe (el orchestrator
   * podría retriggerear y queremos el último estado, no el primero).
   *
   * Mapping orchestrator outcome → intention outcome:
   *   - 'success'  → 'effective'   (la acción se ejecutó OK)
   *   - 'failure'  → 'ineffective' (la acción falló al ejecutarse)
   *   - 'unknown'  → 'unknown'     (no se ejecutó / no sabemos)
   *
   * Nota: 'effective' acá significa "la acción se ejecutó", no que haya
   * resuelto el problema subyacente. Eso lo evalúa MyCortex en próximos
   * ciclos cuando vea si la anomalía persiste o no.
   */
  async recordOutcome(
    intentionId: string,
    args: {
      outcome:    'effective' | 'partial' | 'ineffective' | 'counterproductive' | 'unknown';
      notes?:     string;
      acknowledgedBy?: string;
    },
  ): Promise<boolean> {
    const result = await this.model.updateOne(
      { intentionId },
      {
        $set: {
          status:           'executed',
          outcome:           args.outcome,
          outcomeNotes:      args.notes,
          outcomeRecordedAt: new Date(),
          acknowledgedAt:    new Date(),
          acknowledgedBy:    args.acknowledgedBy ?? 'orchestrator-service',
        },
      },
    );
    return (result.matchedCount ?? 0) > 0;
  }

  /**
   * Stats de ciclos de razonamiento para el panel /admin/cerebro/costs.
   *
   * Cada cycleId = 1 llamada a Claude. Cada intention dentro del mismo
   * cycleId comparte la llamada. Para contar CICLOS distintos en una
   * ventana, usamos $group por cycleId.
   *
   * Devuelve breakdown por día (para timeline) + por modelo (para cost
   * breakdown — Sonnet vs Opus vs Haiku tienen precios distintos).
   */
  async cycleStats(args: {
    sinceMs: number;
    untilMs?: number;
  }): Promise<{
    byDay:   Array<{ date: string; cycles: number; tokensIn: number; tokensOut: number; costUsd: number }>;
    byModel: Array<{ model: string; cycles: number; tokensIn: number; tokensOut: number; costUsd: number }>;
    totalCycles:                number;
    totalRealTokensIn:          number;
    totalRealTokensOut:         number;
    totalCacheReadTokens:       number;
    totalActualCostUsd:         number;
    cyclesWithRealCost:         number;  // cuántos ciclos tienen tokens persistidos (vs estimación)
  }> {
    const since = new Date(args.sinceMs);
    const until = new Date(args.untilMs ?? Date.now());

    // Distinct cycleIds. $first captura los tokens (todos los docs de un cycleId
    // los comparten — denormalización). Si un cycleId pre-Item4 no tiene tokens,
    // $first devuelve null y caller usará estimación.
    const cycles = await this.model.aggregate([
      { $match: { receivedAt: { $gte: since, $lte: until } } },
      {
        $group: {
          _id:                   '$cycleId',
          model:                 { $first: '$modelUsed' },
          date:                  { $first: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } } },
          tokensIn:              { $first: '$tokensIn' },
          tokensOut:             { $first: '$tokensOut' },
          cacheReadTokens:       { $first: '$cacheReadTokens' },
          cycleCostUsd:          { $first: '$cycleCostUsd' },
        },
      },
    ]);

    interface DayAgg { cycles: number; tokensIn: number; tokensOut: number; costUsd: number }
    interface ModelAgg { cycles: number; tokensIn: number; tokensOut: number; costUsd: number }
    const byDayMap   = new Map<string, DayAgg>();
    const byModelMap = new Map<string, ModelAgg>();

    let totalRealTokensIn     = 0;
    let totalRealTokensOut    = 0;
    let totalCacheReadTokens  = 0;
    let totalActualCostUsd    = 0;
    let cyclesWithRealCost    = 0;

    for (const c of cycles) {
      const model = c.model || 'unknown';
      const tIn   = typeof c.tokensIn  === 'number' ? c.tokensIn  : 0;
      const tOut  = typeof c.tokensOut === 'number' ? c.tokensOut : 0;
      const cost  = typeof c.cycleCostUsd === 'number' ? c.cycleCostUsd : 0;
      const cacheRead = typeof c.cacheReadTokens === 'number' ? c.cacheReadTokens : 0;

      if (tIn > 0) {
        cyclesWithRealCost++;
        totalRealTokensIn  += tIn;
        totalRealTokensOut += tOut;
        totalActualCostUsd += cost;
        totalCacheReadTokens += cacheRead;
      }

      const day = byDayMap.get(c.date) ?? { cycles: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 };
      day.cycles    += 1;
      day.tokensIn  += tIn;
      day.tokensOut += tOut;
      day.costUsd   += cost;
      byDayMap.set(c.date, day);

      const m = byModelMap.get(model) ?? { cycles: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 };
      m.cycles    += 1;
      m.tokensIn  += tIn;
      m.tokensOut += tOut;
      m.costUsd   += cost;
      byModelMap.set(model, m);
    }

    return {
      byDay:   Array.from(byDayMap.entries())
                .map(([date, v]) => ({ date, ...v }))
                .sort((a, b) => a.date.localeCompare(b.date)),
      byModel: Array.from(byModelMap.entries())
                .map(([model, v]) => ({ model, ...v }))
                .sort((a, b) => b.cycles - a.cycles),
      totalCycles:           cycles.length,
      totalRealTokensIn,
      totalRealTokensOut,
      totalCacheReadTokens,
      totalActualCostUsd:    Number(totalActualCostUsd.toFixed(4)),
      cyclesWithRealCost,
    };
  }
}
