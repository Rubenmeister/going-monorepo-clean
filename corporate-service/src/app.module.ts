import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CorporateController } from './api/corporate.controller';
import { HealthController } from './api/health.controller';
import { CorporateService } from './api/corporate.service';
import { CompanySettingsSchema, CompanySettingsSchemaDefinition } from './infrastructure/schemas/company-settings.schema';
import { ApprovalWorkflowSchema, ApprovalWorkflowSchemaDefinition } from './infrastructure/schemas/approval-workflow.schema';
import { SpendingLimitSchema, SpendingLimitSchemaDefinition } from './infrastructure/schemas/spending-limit.schema';
import { CorporateInvoiceSchema, CorporateInvoiceSchemaDefinition } from './infrastructure/schemas/corporate-invoice.schema';
import { CompanySettingsRepository } from './infrastructure/persistence/company-settings.repository';
import { ApprovalWorkflowRepository } from './infrastructure/persistence/approval-workflow.repository';
import { SpendingLimitRepository } from './infrastructure/persistence/spending-limit.repository';
import { CorporateInvoiceRepository } from './infrastructure/persistence/corporate-invoice.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/corporate',
      {
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
    ]),
  ],
  controllers: [CorporateController, HealthController],
  providers: [CorporateService, CompanySettingsRepository, ApprovalWorkflowRepository, SpendingLimitRepository, CorporateInvoiceRepository],
})
export class AppModule {}
