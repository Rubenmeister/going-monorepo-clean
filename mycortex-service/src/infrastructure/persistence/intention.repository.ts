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
    byDay:   Array<{ date: string; cycles: number }>;
    byModel: Array<{ model: string; cycles: number }>;
    totalCycles: number;
  }> {
    const since = new Date(args.sinceMs);
    const until = new Date(args.untilMs ?? Date.now());

    // Distinct cycleIds en la ventana. Usamos $group por cycleId + first(modelUsed/date)
    // para conseguir 1 fila por ciclo.
    const cycles = await this.model.aggregate([
      { $match: { receivedAt: { $gte: since, $lte: until } } },
      {
        $group: {
          _id: '$cycleId',
          model: { $first: '$modelUsed' },
          date:  { $first: { $dateToString: { format: '%Y-%m-%d', date: '$receivedAt' } } },
        },
      },
    ]);

    const byDayMap   = new Map<string, number>();
    const byModelMap = new Map<string, number>();
    for (const c of cycles) {
      byDayMap.set(c.date,  (byDayMap.get(c.date) ?? 0) + 1);
      byModelMap.set(c.model || 'unknown', (byModelMap.get(c.model || 'unknown') ?? 0) + 1);
    }

    return {
      byDay:   Array.from(byDayMap.entries())
                .map(([date, cycles]) => ({ date, cycles }))
                .sort((a, b) => a.date.localeCompare(b.date)),
      byModel: Array.from(byModelMap.entries())
                .map(([model, cycles]) => ({ model, cycles }))
                .sort((a, b) => b.cycles - a.cycles),
      totalCycles: cycles.length,
    };
  }
}
