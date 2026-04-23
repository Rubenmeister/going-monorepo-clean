import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionController } from './api/subscription.controller';
import { HealthController } from './api/health.controller';
import { SubscriptionService } from './application/subscription.service';
import { SubscriptionSchema, SubscriptionSchemaDefinition } from './infrastructure/schemas/subscription.schema';
import { SubscriptionRepository } from './infrastructure/persistence/subscription.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.SUBSCRIPTION_DB_URL || 'mongodb://localhost:27017/subscription', {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    MongooseModule.forFeature([
      { name: SubscriptionSchema.name, schema: SubscriptionSchemaDefinition },
    ]),
  ],
  controllers: [SubscriptionController, HealthController],
  providers: [SubscriptionService, SubscriptionRepository],
})
export class AppModule {}
