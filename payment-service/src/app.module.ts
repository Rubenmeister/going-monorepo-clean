import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { PaymentController } from './api/payment.controller';
import { HealthController } from './api/health.controller';
import { WebhookController } from './api/webhook.controller';
import { PaymentOperationsController } from './api/controllers/payment-operations.controller';
import {
  CreatePaymentIntentUseCase,
} from '@going-monorepo-clean/domains-payment-application';
import { PricingService } from './application/pricing.service';
import { FareEngine } from './application/fare-engine.service';
import { PricingClient } from './infrastructure/pricing-client';
import { QuoteStore } from './application/quote-store.service';
import { LoyaltyClient } from './application/loyalty-client.service';
import { TransportClient } from './application/transport-client.service';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { CompleteRideUseCase } from './application/use-cases/complete-ride.use-case';
import { CreatePayoutUseCase } from './application/use-cases/create-payout.use-case';
import { DriverEarningsController } from './api/driver-earnings.controller';
import {
  ProviderBankAccount,
  ProviderBankAccountSchema,
} from './infrastructure/schemas/provider-bank-account.schema';
import { WalletController } from './api/wallet.controller';
import { WalletService } from './application/wallet.service';
import { RechargeService } from './application/recharge.service';
import { UserLookupClient } from './application/user-lookup-client.service';
import {
  Wallet,
  WalletSchema,
  WalletTransaction,
  WalletTransactionSchema,
} from './infrastructure/schemas/wallet.schema';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import {
  IRoutingProvider,
  OsrmRoutingProvider,
} from '@going-monorepo-clean/shared-infrastructure';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MongooseModule.forRoot(process.env.PAYMENT_DB_URL, {
      // Base nombrada — sin esto Mongo cae en la default `test` (migración 11-jun-2026)
      dbName: process.env.MONGO_DB_NAME || 'going-payments',
      lazyConnection: true,
      connectionFactory: (conn) => {
        conn.on('error', (e) => console.warn('MongoDB:', e.message));
        return conn;
      },
    }),
    InfrastructureModule, // exports ITransactionRepository, IPaymentRepository, IPayoutRepository, gateways
    MongooseModule.forFeature([
      { name: Wallet.name, schema: WalletSchema },
      { name: WalletTransaction.name, schema: WalletTransactionSchema },
      { name: ProviderBankAccount.name, schema: ProviderBankAccountSchema },
    ]),
  ],
  controllers: [
    PaymentController,             // POST /payments/intent, POST /payments/estimate
    PaymentOperationsController,   // POST /payments/process, POST /payments/complete-ride, GET /payments/:id, etc.
    WebhookController,             // POST /webhooks/datafast, POST /webhooks/deuna
    HealthController,
    DriverEarningsController,      // GET /drivers/me/wallet, GET /drivers/me/earnings, POST /drivers/me/withdraw
    WalletController,              // GET /payments/wallet/:userId/balance|transactions
  ],
  providers: [
    // Domain lib use cases (use ITransactionRepository + IPaymentGateway from InfrastructureModule)
    CreatePaymentIntentUseCase,
    // Service-level use cases (use IPaymentRepository + IPayoutRepository)
    PricingService,
    PricingClient,
    FareEngine,
    QuoteStore,
    LoyaltyClient,
    TransportClient,
    ProcessPaymentUseCase,
    CompleteRideUseCase,
    CreatePayoutUseCase,
    WalletService,
    RechargeService,
    UserLookupClient,
    JwtStrategy,
    // Routing provider (OSRM por default). Cambiar a GraphHopper/Mapbox
    // reemplazando el useClass.
    {
      provide: IRoutingProvider,
      useClass: OsrmRoutingProvider,
    },
  ],
})
export class AppModule {}
