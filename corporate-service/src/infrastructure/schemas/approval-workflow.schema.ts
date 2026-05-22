import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'approval_workflows' })
export class ApprovalWorkflowSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  bookingId: string;

  @Prop({ default: '' })
  requesterId: string;

  @Prop({ default: '' })
  requesterName: string;

  @Prop({ default: '' })
  serviceType: string;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ default: '' })
  description: string;

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true })
  status: string;

  // ── Cadena de aprobación multinivel ─────────────────────────────────────────
  /**
   * Pasos de la cadena (manager → finanzas → dirección, según el monto). Cada
   * paso: { level, role, approverId, status, decidedBy, decidedAt, comments }.
   */
  @Prop({ type: [Object], default: [] })
  approvalChain: Record<string, unknown>[];

  /** Nivel que debe decidir ahora (1-based). 0 cuando ya no hay pendientes. */
  @Prop({ default: 1 })
  currentLevel: number;

  // ── Última decisión / resultado global ──────────────────────────────────────
  @Prop({ default: null })
  decidedBy: string | null;

  @Prop({ default: null })
  decidedAt: Date | null;

  @Prop({ default: '' })
  comments: string;

  @Prop({ type: Object, default: {} })
  bookingDetails: Record<string, unknown>;
}

export const ApprovalWorkflowSchemaDefinition = SchemaFactory.createForClass(ApprovalWorkflowSchema);
