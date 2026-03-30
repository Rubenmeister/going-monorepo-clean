import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MLController } from './ml.controller';
import { HealthController } from './health.controller';
import { MLService } from './ml.service';
import { AdvancedModelsService } from './advanced-models.service';
import { MLTrainingService } from './ml-training.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [MLController, HealthController],
  providers: [MLService, AdvancedModelsService, MLTrainingService],
})
export class AppModule {}
