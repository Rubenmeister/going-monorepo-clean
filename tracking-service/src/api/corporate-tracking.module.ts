import { Module } from '@nestjs/common';
import { CorporateTrackingGateway } from './corporate-tracking.gateway';

/**
 * Corporate Tracking Module
 * Registers the WebSocket gateway for real-time corporate trip tracking
 */
@Module({
  providers: [CorporateTrackingGateway],
  exports: [CorporateTrackingGateway],
})
export class CorporateTrackingModule {}
