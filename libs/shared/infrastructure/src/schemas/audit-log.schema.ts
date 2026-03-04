import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'audit_logs', timestamps: true })
export class AuditLogDocument extends Document {
  @Prop({ required: true, index: true })
  id: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  serviceId: string;

  @Prop({ required: true })
  ipAddress: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  resourceType: string;

  @Prop({ required: true, index: true })
  resourceId: string;

  @Prop({
    type: [{ field: String, oldValue: Object, newValue: Object }],
    default: [],
  })
  changes: Array<{ field: string; oldValue?: unknown; newValue?: unknown }>;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true })
  duration: number;

  @Prop({ required: true, enum: ['success', 'failure', 'partial'] })
  result: string;

  @Prop()
  errorMessage?: string;

  @Prop({ type: Object })
  metadata?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLogDocument);

// Compound indexes for common query patterns
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, result: 1, timestamp: -1 });
AuditLogSchema.index({ result: 1, timestamp: -1 });
AuditLogSchema.index({ timestamp: -1 });

// TTL index: documents with expireAt field auto-deleted (used by retention service)
AuditLogSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0, sparse: true });
