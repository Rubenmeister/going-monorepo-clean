import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IntentionRepository } from '../infrastructure/persistence/intention.repository';
import { MemoryRollupRepository } from '../infrastructure/persistence/memory-rollup.repository';
import { MemoryRollupEntity } from '../infrastructure/schemas/memory-rollup.schema';

/**
 * Genera un rollup semanal de la actividad de MyCortex.
 *
 * @Cron domingo 23:55 Ecuador (cierra la semana operativa).
 * Lo expone también vía run-now para regeneración manual.
 *
 * Aggregation tactics:
 *   - Lee todas las intenciones cuyo receivedAt cae dentro de la semana.
 *   - Agrupa por type, outcome, status, model.
 *   - Genera summary narrativo programático ("Esta semana propusiste X
 *     intenciones, Y se ejecutaron, top type fue Z").
 *
 * El summary podría regenerarse con un LLM en el futuro (más rico). Hoy
 * mantenemos programático para evitar dependencia de Claude para algo
 * que no es razonamiento.
 */
@Injectable()
export class MemoryRollupService {
  private readonly logger = new Logger(MemoryRollupService.name);

  constructor(
    private readonly intentions: IntentionRepository,
    private readonly rollups:    MemoryRollupRepository,
  ) {}

  /**
   * @Cron domingo 23:55 Ecuador. Expresión: 55 23 * * 0
   * Domingos cierran la semana operativa antes de que el lunes empiecen
   * los nuevos crons semanales (content-agent, marketing-agent).
   */
  @Cron('55 23 * * 0', { name: 'mycortex-rollup-weekly', timeZone: 'America/Guayaquil' })
  async runScheduled(): Promise<void> {
    const { start, end } = lastWeekRange();
    this.logger.log(
      `Generando rollup semanal: ${start.toISOString()} → ${end.toISOString()}`,
    );
    await this.generateForWeek({ weekStarting: start, weekEnding: end });
  }

  /**
   * Punto de entrada manual — el controller lo llama para regenerar
   * un rollup específico (ej: backfill semanas pasadas, debugging).
   */
  async generateForWeek(args: {
    weekStarting: Date;
    weekEnding:   Date;
  }): Promise<MemoryRollupEntity> {
    // Trae TODAS las intenciones recientes — luego filtramos en memoria
    // por weekStarting/Ending. La cantidad es chica (decenas/cientos por
    // semana), no tiene sentido un query con índice acá.
    const all = await this.intentions.recent(2000);
    const inWindow = all.filter(i => {
      const t = new Date(i.receivedAt as unknown as string).getTime();
      return t >= args.weekStarting.getTime() && t <= args.weekEnding.getTime();
    });

    const byType    = aggregateByType(inWindow);
    const byOutcome = aggregateByOutcome(inWindow);
    const byStatus  = aggregateByStatus(inWindow);
    const byModel   = aggregateByModel(inWindow);
    const summary   = buildSummary({
      total:     inWindow.length,
      weekStart: args.weekStarting,
      weekEnd:   args.weekEnding,
      byType,
      byOutcome,
      byStatus,
    });

    const saved = await this.rollups.save({
      weekStarting:    args.weekStarting,
      weekEnding:      args.weekEnding,
      totalIntentions: inWindow.length,
      byType,
      byOutcome,
      byStatus,
      byModel,
      summary,
    });
    this.logger.log(
      `Rollup ${saved.weekStarting.toISOString()}: ${inWindow.length} intentions, ${byType.length} types`,
    );
    return saved;
  }
}

// ─── Helpers de agregación ─────────────────────────────────────

function aggregateByType(items: Array<{ type: string; urgency: number; status: string }>) {
  const map = new Map<string, { count: number; sumUrg: number; executedCount: number }>();
  for (const i of items) {
    const e = map.get(i.type) || { count: 0, sumUrg: 0, executedCount: 0 };
    e.count++;
    e.sumUrg += (i.urgency ?? 0);
    if (i.status === 'executed') e.executedCount++;
    map.set(i.type, e);
  }
  return Array.from(map.entries())
    .map(([type, e]) => ({
      type,
      count:         e.count,
      avgUrgency:    Number((e.sumUrg / e.count).toFixed(2)),
      executedCount: e.executedCount,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function aggregateByOutcome(items: Array<{ outcome?: string }>) {
  const map = new Map<string, number>();
  for (const i of items) {
    const o = i.outcome ?? 'unknown';
    map.set(o, (map.get(o) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([outcome, count]) => ({ outcome, count }))
    .sort((a, b) => b.count - a.count);
}

function aggregateByStatus(items: Array<{ status: string }>) {
  const map = new Map<string, number>();
  for (const i of items) {
    map.set(i.status, (map.get(i.status) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

function aggregateByModel(items: Array<{ modelUsed?: string }>) {
  const map = new Map<string, number>();
  for (const i of items) {
    const m = i.modelUsed ?? 'unknown';
    map.set(m, (map.get(m) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count);
}

function buildSummary(args: {
  total:     number;
  weekStart: Date;
  weekEnd:   Date;
  byType:    Array<{ type: string; count: number; avgUrgency: number; executedCount: number }>;
  byOutcome: Array<{ outcome: string; count: number }>;
  byStatus:  Array<{ status: string; count: number }>;
}): string {
  if (args.total === 0) {
    return `Semana ${args.weekStart.toISOString().slice(0, 10)} → ${args.weekEnd.toISOString().slice(0, 10)}: ` +
           `0 intenciones emitidas. Sistema en silencio.`;
  }

  const top3 = args.byType.slice(0, 3);
  const executed = args.byStatus.find(s => s.status === 'executed')?.count ?? 0;
  const expired  = args.byStatus.find(s => s.status === 'expired')?.count  ?? 0;
  const effective = args.byOutcome.find(o => o.outcome === 'effective')?.count ?? 0;
  const ineffective = args.byOutcome.find(o => o.outcome === 'ineffective')?.count ?? 0;

  const execRate = args.total > 0 ? (executed / args.total * 100).toFixed(0) : '0';
  const effRate  = executed > 0 ? (effective / executed * 100).toFixed(0) : 'n/a';

  const lines = [
    `Semana ${args.weekStart.toISOString().slice(0, 10)} → ${args.weekEnd.toISOString().slice(0, 10)}: ` +
    `${args.total} intenciones, ${execRate}% ejecutadas, ${effRate}% effective.`,
    `Top 3 types: ${top3.map(t => `${t.type} (${t.count})`).join(', ')}.`,
  ];

  if (expired > 0) {
    lines.push(`${expired} intención(es) expiraron sin actuar.`);
  }
  if (ineffective > 0) {
    lines.push(`${ineffective} ejecuciones ineffective — revisar reglas o prompt.`);
  }

  return lines.join(' ');
}

/**
 * Devuelve el rango de la semana ANTERIOR al punto de invocación, alineado
 * a lunes 00:00 → domingo 23:59:59. Pensado para el cron del domingo
 * 23:55 — captura la semana que está cerrando.
 *
 * Usa hora Ecuador (UTC-5) implícita: el server vive en UTC pero el cron
 * está timeZone='America/Guayaquil', así que cuando dispara, ya es domingo
 * 23:55 EC → semana es lun 00:00 EC a dom 23:59 EC.
 */
function lastWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = sun
  // Ajuste: queremos el INICIO de esta semana (lunes pasado).
  const daysFromMonday = (dayOfWeek + 6) % 7;
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() - daysFromMonday);
  start.setUTCHours(5, 0, 0, 0); // lunes 00:00 EC = lunes 05:00 UTC

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(28, 59, 59, 999); // = domingo 23:59 EC

  return { start, end };
}
