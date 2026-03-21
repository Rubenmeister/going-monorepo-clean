import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InvoiceController } from './api/invoice.controller';
import { HealthController } from './api/health.controller';
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
    MongooseModule.forRoot(process.env.MONGODB_URI, {
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
        secret: config.get('JWT_SECRET', 'default-secret'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [InvoiceController, HealthController],
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
