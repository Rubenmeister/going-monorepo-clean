import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { TransportApplicationModule } from '@going-monorepo-clean/domains-transport-application';
import { TransportController } from './api/transport.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    InfrastructureModule,
    TransportApplicationModule,
  ],
  controllers: [TransportController],
  providers: [],
})
export class AppModule {}