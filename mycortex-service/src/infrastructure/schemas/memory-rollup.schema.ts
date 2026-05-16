import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Memory rollup — agregado semanal de la actividad de MyCortex.
 *
 * Hoy MyCortex razona con las últimas 20 intenciones. Eso le da contexto
 * táctico ("¿qué pasó esta semana?") pero no estratégico ("¿qué patrones
 * persisten mes a mes?"). Los rollups consolidan info por semana y se
 * inyectan en el prompt para razonamiento de largo plazo.
 *
 * Cada doc representa UNA semana. Generado por @Cron domingo 23:55 Ecuador
 * (justo antes de cierre de semana operativa).
 *
 * TTL 365d — un año de memoria. Más que suficiente para detectar patrones
 * estacionales (Carnaval, fin de año, etc.) sin saturar Atlas.
 */

@Schema({ collection: 'cortex_memory_rollups', timestamps: true })
export class MemoryRollupEntity {
  /** Inicio de la semana (lunes 00:00 Ecuador). Único — un doc por semana. */
  @Prop({ required: true, type: Date, index: true, unique: true })
  weekStarting!: Date;

  /** Fin de la semana (domingo 23:59 Ecuador) — para queries por rango. */
  @Prop({ required: true, type: Date })
  weekEnding!: Date;

  /** Total de intenciones emitidas en la semana. */
  @Prop({ required: true, type: Number, default: 0 })
  totalIntentions!: number;

  /**
   * Breakdown por type. Top 10 ordenado por count desc.
   * Estructura inline para que MyCortex lo parsee directo en el prompt.
   */
  @Prop({
    type: [{
      type:           { type: String, required: true },
      count:          { type: Number, required: true },
      avgUrgency:     { type: Number, required: true },
      executedCount:  { type: Number, default: 0 },
    }],
    default: [],
  })
  byType!: Array<{
    type:           string;
    count:          number;
    avgUrgency:     number;
    executedCount:  number;
  }>;

  /**
   * Breakdown por outcome — qué tan efectivas fueron las intenciones que
   * se ejecutaron (Etapa B feedback). Si todo es 'unknown', significa que
   * no se ejecutó ninguna o el feedback loop está roto.
   */
  @Prop({
    type: [{
      outcome: { type: String, required: true },
      count:   { type: Number, required: true },
    }],
    default: [],
  })
  byOutcome!: Array<{
    outcome: string;     // 'effective' | 'partial' | 'ineffective' | 'counterproductive' | 'unknown'
    count:   number;
  }>;

  /**
   * Conteos por status del lifecycle (proposed → executed → expired).
   * El ratio executed/total mide qué tan accionable estuvo MyCortex.
   */
  @Prop({
    type: [{
      status: { type: String, required: true },
      count:  { type: Number, required: true },
    }],
    default: [],
  })
  byStatus!: Array<{
    status: string;
    count:  number;
  }>;

  /**
   * Modelo(s) usado(s) en la semana — útil cuando se experimenta cambios
   * de modelo y queremos ver impacto.
   */
  @Prop({
    type: [{
      model: { type: String, required: true },
      count: { type: Number, required: true },
    }],
    default: [],
  })
  byModel!: Array<{
    model: string;
    count: number;
  }>;

  /**
   * Resumen narrativo de 200-300 palabras. Hoy se genera programático
   * (concatena counts). Podría regenerarse con un LLM en el futuro.
   */
  @Prop({ type: String, default: '' })
  summary!: string;

  // TTL 365d — un año de memoria estratégica.
  @Prop({ type: Date, default: () => new Date(), index: true, expires: '365d' })
  generatedAt!: Date;
}

export type MemoryRollupDocument = MemoryRollupEntity & Document;
export const MemoryRollupSchema = SchemaFactory.createForClass(MemoryRollupEntity);
