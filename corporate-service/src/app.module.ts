import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CorporateController } from './api/corporate.controller';
import { CorporatePublicController } from './api/corporate-public.controller';
import { HealthController } from './api/health.controller';
import { CorporateService } from './api/corporate.service';
import { CompanySettingsSchema, CompanySettingsSchemaDefinition } from './infrastructure/schemas/company-settings.schema';
import { ApprovalWorkflowSchema, ApprovalWorkflowSchemaDefinition } from './infrastructure/schemas/approval-workflow.schema';
import { SpendingLimitSchema, SpendingLimitSchemaDefinition } from './infrastructure/schemas/spending-limit.schema';
import { CorporateInvoiceSchema, CorporateInvoiceSchemaDefinition } from './infrastructure/schemas/corporate-invoice.schema';
import { TeamInvitationSchema, TeamInvitationSchemaDefinition } from './infrastructure/schemas/team-invitation.schema';
import { QuoteSchema, QuoteSchemaDefinition } from './infrastructure/schemas/quote.schema';
import { DashcamClipRequestSchema, DashcamClipRequestSchemaDefinition } from './infrastructure/schemas/dashcam-clip-request.schema';
import { CompanyApplicationSchema, CompanyApplicationSchemaDefinition } from './infrastructure/schemas/company-application.schema';
import { CompanySettingsRepository } from './infrastructure/persistence/company-settings.repository';
import { ApprovalWorkflowRepository } from './infrastructure/persistence/approval-workflow.repository';
import { SpendingLimitRepository } from './infrastructure/persistence/spending-limit.repository';
import { CorporateInvoiceRepository } from './infrastructure/persistence/corporate-invoice.repository';
import { TeamInvitationRepository } from './infrastructure/persistence/team-invitation.repository';
import { QuoteRepository } from './infrastructure/persistence/quote.repository';
import { DashcamClipRequestRepository } from './infrastructure/persistence/dashcam-clip-request.repository';
import { CompanyApplicationRepository } from './infrastructure/persistence/company-application.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // MONGO_URL primero: es el env que Cloud Run tiene mapeado al secret —
    // con solo MONGODB_URI este servicio caía al fallback localhost en prod.
    MongooseModule.forRoot(
      process.env.MONGO_URL ||
        process.env.MONGODB_URI ||
        'mongodb://localhost:27017/corporate',
      {
        // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
        dbName: process.env.MONGO_DB_NAME || 'going-corporate',
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e) => console.warn('MongoDB corporate:', e.message));
          return conn;
        },
      },
    ),
    MongooseModule.forFeature([
      { name: CompanySettingsSchema.name, schema: CompanySettingsSchemaDefinition },
      { name: ApprovalWorkflowSchema.name, schema: ApprovalWorkflowSchemaDefinition },
      { name: SpendingLimitSchema.name, schema: SpendingLimitSchemaDefinition },
      { name: CorporateInvoiceSchema.name, schema: CorporateInvoiceSchemaDefinition },
      { name: TeamInvitationSchema.name, schema: TeamInvitationSchemaDefinition },
      { name: QuoteSchema.name, schema: QuoteSchemaDefinition },
      { name: DashcamClipRequestSchema.name, schema: DashcamClipRequestSchemaDefinition },
      { name: CompanyApplicationSchema.name, schema: CompanyApplicationSchemaDefinition },
    ]),
  ],
  controllers: [CorporateController, CorporatePublicController, HealthController],
  providers: [CorporateService, CompanySettingsRepository, ApprovalWorkflowRepository, SpendingLimitRepository, CorporateInvoiceRepository, TeamInvitationRepository, QuoteRepository, DashcamClipRequestRepository, CompanyApplicationRepository],
})
export class AppModule {}
