import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupplyChainController } from './supply-chain.controller';
import { HealthController } from './health.controller';
import { SupplyChainService } from './supply-chain.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [SupplyChainController, HealthController],
  providers: [SupplyChainService],
})
export class AppModule {}
