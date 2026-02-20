import { Module } from '@nestjs/common';
import { CorporateTrackingGateway } from './corporate-tracking.gateway';
import { CorporateAuthModule } from '@going-monorepo-clean/features-corporate-auth';

/**
 * Corporate Tracking Module
 * Registers the WebSocket gateway for real-time corporate trip tracking
 * with LOPD Ecuador audit logging and multi-tenant isolation
 */
@Module({
  imports: [CorporateAuthModule],
  providers: [CorporateTrackingGateway],
  exports: [CorporateTrackingGateway],
})
export class CorporateTrackingModule {}
