import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InvoiceController } from './api/invoice.controller';
import { HealthController } from './api/health.controller';
import { InternalController } from './api/internal.controller';
import { InvoiceService } from './application/services/invoice.service';
import { InvoiceEmailService } from './application/services/invoice-email.service';
import { PdfGeneratorService } from './application/services/pdf-generator.service';
import { TaxCalculatorService } from './application/services/tax-calculator.service';
import { InvoiceRepository } from './infrastructure/persistence/invoice.repository';
import { InvoiceSchema, InvoiceSchemaDefinition } from './infrastructure/schemas/invoice.schema';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // MONGO_URL primero: es el env que Cloud Run tiene mapeado al secret —
    // con solo MONGODB_URI este servicio caía al fallback localhost en prod.
    MongooseModule.forRoot(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/billing', {
      // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
      dbName: process.env.MONGO_DB_NAME || 'going-billing',
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    MongooseModule.forFeature([{ name: InvoiceSchema.name, schema: InvoiceSchemaDefinition }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [InvoiceController, HealthController, InternalController],
  providers: [
    InvoiceService,
    InvoiceEmailService,
    PdfGeneratorService,
    TaxCalculatorService,
    InvoiceRepository,
    JwtStrategy,
  ],
})
export class AppModule {}
