import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Audit log de cambios a cortex_config. Cada PUT /mycortex/config crea
 * una entrada acá con before/after snapshots + actor.
 *
 * Diseño:
 *   - TTL 180 días — 6 meses de historia es más que suficiente para
 *     diagnosticar "qué cambió" en debug operativo.
 *   - Guardamos before + after completos (no diffs). Más espacio pero
 *     simplifica la UI: cada fila es independiente, no necesita reconstruir.
 *   - snapshotBefore puede ser null en la primera entrada (creación inicial).
 */

@Schema({ collection: 'cortex_config_audit', timestamps: false })
export class ConfigAuditEntity {
  @Prop({ type: String, required: true })
  changedBy!: string;

  @Prop({ type: Date, required: true, index: true })
  changedAt!: Date;

  /** Lista de fields que cambiaron (mejor que diff full para detección rápida). */
  @Prop({ type: [String], default: [] })
  changedFields!: string[];

  /** Snapshot completo ANTES del cambio. Null si era la primera vez. */
  @Prop({ type: Object })
  snapshotBefore?: Record<string, unknown>;

  /** Snapshot completo DESPUÉS del cambio. */
  @Prop({ type: Object, required: true })
  snapshotAfter!: Record<string, unknown>;

  // TTL 180d — debug operativo, no audit legal.
  @Prop({ type: Date, default: () => new Date(), index: true, expires: '180d' })
  createdAt!: Date;
}

export type ConfigAuditDocument = ConfigAuditEntity & Document;
export const ConfigAuditSchema = SchemaFactory.createForClass(ConfigAuditEntity);
ConfigAuditSchema.index({ changedAt: -1 });
