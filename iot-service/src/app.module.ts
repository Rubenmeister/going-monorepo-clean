import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IoTController } from './iot.controller';
import { HealthController } from './health.controller';
import { IoTService } from './iot.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [IoTController, HealthController],
  providers: [IoTService],
})
export class AppModule {}
