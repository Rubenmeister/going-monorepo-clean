import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockchainController } from './api/blockchain.controller';
import { HealthController } from './api/health.controller';
import { BlockchainService } from './application/blockchain.service';
import { BlockSchema, BlockSchemaDefinition } from './infrastructure/schemas/block.schema';
import { TripRecordSchema, TripRecordSchemaDefinition } from './infrastructure/schemas/trip-record.schema';
import { BlockchainRepository } from './infrastructure/persistence/blockchain.repository';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.BLOCKCHAIN_DB_URL || 'mongodb://localhost:27017/blockchain', {
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    MongooseModule.forFeature([
      { name: BlockSchema.name, schema: BlockSchemaDefinition },
      { name: TripRecordSchema.name, schema: TripRecordSchemaDefinition },
    ]),
  ],
  controllers: [BlockchainController, HealthController],
  providers: [BlockchainService, BlockchainRepository],
})
export class AppModule {}
