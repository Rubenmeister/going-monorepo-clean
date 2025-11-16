import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrackingGateway } from './tracking.gateway';

@Module({
  imports: [HttpModule], // Necesita HttpModule para llamar al tracking-service
  providers: [TrackingGateway],
})
export class TrackingModule {}