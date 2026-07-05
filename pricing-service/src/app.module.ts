import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import {
  RateFareList,
  RateFareListSchema,
} from './infrastructure/schemas/rate-fare-list.schema';
import {
  RateRule,
  RateRuleSchema,
} from './infrastructure/schemas/rate-rule.schema';
import { PricingEngineService } from './application/pricing-engine.service';
import { PriceController } from './api/price.controller';
import { HealthController } from './api/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // MONGO_URL = secret estándar en Cloud Run. db `going-pricing` (nombrada
    // explícita para no caer en la default `test`; override con MONGO_DB_NAME).
    MongooseModule.forRoot(
      process.env.MONGO_URL ||
        process.env.MONGODB_URL ||
        'mongodb://localhost:27017/going-pricing',
      {
        dbName: process.env.MONGO_DB_NAME || 'going-pricing',
        lazyConnection: true,
        connectionFactory: (conn) => {
          conn.on('error', (e: Error) =>
            console.warn('MongoDB connection error:', e.message),
          );
          return conn;
        },
      },
    ),
    MongooseModule.forFeature([
      { name: RateFareList.name, schema: RateFareListSchema },
      { name: RateRule.name, schema: RateRuleSchema },
    ]),
  ],
  providers: [PricingEngineService],
  controllers: [PriceController, HealthController],
  exports: [PricingEngineService],
})
export class AppModule {}
