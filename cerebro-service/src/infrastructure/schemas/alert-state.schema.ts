import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Estado persistido del HealthMonitorService — set de alert IDs actualmente
 * "activos" (encendidos). Persistirlo en Mongo evita re-spam de Telegram
 * cuando el container de cerebro se recicla (min-instances=0): al re-arrancar
 * carga el set previo y solo dispara `:new` para transiciones reales.
 *
 * Diseño:
 *   - Colección con UN solo documento (singleton). _id fijo = 'singleton'
 *     para garantizar upserts idempotentes.
 *   - Sin TTL: queremos que sobreviva restarts indefinidamente.
 *   - Tamaño esperado: <1KB (Set de ~5-10 IDs cortos como
 *     `agent:stale:customer-support-service`).
 *
 * Alternativa considerada: persistir activeAlerts dentro del WorldSnapshot.
 * Descartada porque snapshots se escriben cada 10min por WorldModelService,
 * y HealthMonitor evalúa en otro cron — habría race conditions. Colección
 * propia es más limpio.
 */
@Schema({ collection: 'cerebro_alert_state', timestamps: true })
export class AlertStateEntity {
  /** Singleton — siempre el mismo _id para que upsert reemplace en vez de insertar. */
  @Prop({ type: String, required: true })
  _id!: string;

  /** Lista de alert IDs encendidos. Ejemplo:
   *  ['systemHealth:degraded', 'agent:stale:customer-support-service']. */
  @Prop({ type: [String], default: [] })
  activeAlertIds!: string[];

  /** Mongoose timestamps maneja updatedAt automático. Lo declaramos
   *  explícito para que TypeScript lo conozca al hacer .lean(). */
  @Prop({ type: Date })
  updatedAt?: Date;
}

export type AlertStateDocument = AlertStateEntity & Document;
export const AlertStateSchema = SchemaFactory.createForClass(AlertStateEntity);
