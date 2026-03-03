import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TrackingGateway } from './tracking.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    HttpModule, // Necesita HttpModule para llamar al tracking-service
    AuthModule, // Provides JwtService (via JwtModule) and ITokenManager
  ],
  providers: [TrackingGateway],
})
export class TrackingModule {}
