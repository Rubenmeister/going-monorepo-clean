import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Audit log de verificaciones post-acción de Fase A del cerebro autónomo.
 *
 * Cada vez que el dispatcher ejecuta una acción que está en la
 * `AUTONOMOUS_ALLOWLIST`, se persiste un doc acá con:
 *   - snapshot de la métrica ANTES
 *   - snapshot de la métrica DESPUÉS (waitMs después)
 *   - veredicto: convergió / falló
 *
 * Es la trazabilidad humana de "el cerebro actuó solo y esto pasó".
 */
@Schema({ collection: 'action_verifications', timestamps: true })
export class ActionVerification {
  @Prop({ required: true, index: true })
  decisionId: string;

  @Prop({ required: true })
  intentType: string;

  @Prop({ required: true })
  verifierKey: string;

  @Prop({ required: true, enum: ['decrease', 'increase'] })
  direction: 'decrease' | 'increase';

  @Prop({ required: true })
  minDelta: number;

  /** Métrica medida ANTES del dispatch. */
  @Prop({ required: true })
  metricBefore: number;

  @Prop({ required: true })
  metricBeforeAt: Date;

  /** Métrica medida DESPUÉS, una vez transcurrido waitMs. */
  @Prop()
  metricAfter?: number;

  @Prop()
  metricAfterAt?: Date;

  /** metricAfter - metricBefore. */
  @Prop()
  delta?: number;

  /** True si delta cumple direction + minDelta. */
  @Prop()
  converged?: boolean;

  @Prop({
    required: true,
    enum: ['pending_verification', 'converged', 'failed_to_converge', 'skipped_no_metric'],
    default: 'pending_verification',
    index: true,
  })
  status: 'pending_verification' | 'converged' | 'failed_to_converge' | 'skipped_no_metric';

  /** Copia del campo de la entry — qué pasa si la verificación falla. */
  @Prop({ required: true, enum: ['alert_only', 'rollback'] })
  onVerifyFail: 'alert_only' | 'rollback';

  /** Si onVerifyFail='rollback' y se ejecutó, el decisionId del rollback. */
  @Prop()
  rollbackDecisionId?: string;
}

export type ActionVerificationDocument = HydratedDocument<ActionVerification>;
export const ActionVerificationSchema = SchemaFactory.createForClass(ActionVerification);
