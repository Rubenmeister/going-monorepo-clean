/**
 * Analytics Schemas - MongoDB
 * Collections for storing analytics data and reports
 */

import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'dashboard-kpis',
  timestamps: true,
  indexes: [{ companyId: 1, date: -1 }, { date: -1 }],
})
export class DashboardKPISchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true, index: true })
  date: Date;

  // Location Tracking KPIs
  @Prop({ default: 0 })
  totalTrips: number;

  @Prop({ default: 0 })
  activeDrivers: number;

  @Prop({ default: 0 })
  totalDistanceTraveled: number;

  @Prop({ default: 0 })
  averageSpeedPerDriver: number;

  @Prop({ default: 0 })
  estimatedFuelCost: number;

  // Invoicing KPIs
  @Prop({ default: 0 })
  totalInvoicesIssued: number;

  @Prop({ default: 0 })
  totalInvoicesOverdue: number;

  @Prop({ default: 0 })
  totalRevenueThisMonth: number;

  @Prop({ default: 0 })
  totalRevenueThisYear: number;

  @Prop({ default: 0 })
  averagePaymentTime: number;

  @Prop({ default: 0 })
  outstandingAmount: number;

  // Notification KPIs
  @Prop({ default: 0 })
  totalNotificationsSent: number;

  @Prop({ default: 0 })
  notificationDeliveryRate: number;

  @Prop({ default: 0 })
  notificationReadRate: number;

  // System Health
  @Prop({ default: 100 })
  systemUptime: number;

  @Prop({ default: 0 })
  averageResponseTime: number;

  @Prop({ default: 0 })
  errorRate: number;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}

@Schema({
  collection: 'reports',
  timestamps: true,
  indexes: [
    { companyId: 1, createdAt: -1 },
    { createdBy: 1, companyId: 1 },
    { type: 1, companyId: 1 },
    { expiresAt: 1 },
  ],
})
export class ReportSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({
    required: true,
    enum: [
      'TRIP_REPORT',
      'INVOICE_REPORT',
      'NOTIFICATION_REPORT',
      'DRIVER_PERFORMANCE',
      'REVENUE_REPORT',
      'SYSTEM_HEALTH',
      'COMPLIANCE_REPORT',
    ],
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ type: Object, required: true })
  data: Record<string, any>;

  @Prop({ required: true })
  totalRecords: number;

  @Prop({ required: true, enum: ['PDF', 'XLSX', 'CSV', 'JSON'] })
  format: string;

  @Prop({ default: 'COMPLETED', enum: ['GENERATING', 'COMPLETED', 'FAILED'] })
  status: string;

  @Prop()
  fileUrl?: string;

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop()
  expiresAt?: Date;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;
}

@Schema({
  collection: 'audit-logs',
  timestamps: true,
  indexes: [
    { companyId: 1, createdAt: -1 },
    { userId: 1, companyId: 1 },
    { entityType: 1, entityId: 1 },
  ],
})
export class AuditLogSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  entityType: string;

  @Prop({ required: true })
  entityId: string;

  @Prop({ type: Object })
  changes: Record<string, { before: any; after: any }>;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

@Schema({
  collection: 'export-jobs',
  timestamps: true,
  indexes: [
    { companyId: 1, createdAt: -1 },
    { status: 1, companyId: 1 },
    { expiresAt: 1 },
  ],
})
export class ExportJobSchema extends Document {
  @Prop({ required: true, index: true })
  companyId: string;

  @Prop({ required: true })
  createdBy: string;

  @Prop({ required: true })
  reportType: string;

  @Prop({ required: true, enum: ['PDF', 'XLSX', 'CSV', 'JSON'] })
  format: string;

  @Prop({ type: Object })
  filters: Record<string, any>;

  @Prop({
    default: 'QUEUED',
    enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
  })
  status: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: 0 })
  totalRecords: number;

  @Prop({ default: 0 })
  processedRecords: number;

  @Prop()
  fileUrl?: string;

  @Prop()
  fileName?: string;

  @Prop()
  fileSize?: number;

  @Prop()
  errorMessage?: string;

  @Prop({ default: () => new Date() })
  createdAt: Date;

  @Prop({ default: () => new Date() })
  updatedAt: Date;

  @Prop()
  completedAt?: Date;

  @Prop({ required: true })
  expiresAt: Date;
}

export const DashboardKPISchemaDefinition =
  SchemaFactory.createForClass(DashboardKPISchema);
export const ReportSchemaDefinition =
  SchemaFactory.createForClass(ReportSchema);
export const AuditLogSchemaDefinition =
  SchemaFactory.createForClass(AuditLogSchema);
export const ExportJobSchemaDefinition =
  SchemaFactory.createForClass(ExportJobSchema);

// TTL index for auto-cleanup
ReportSchemaDefinition.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
ExportJobSchemaDefinition.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
