import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Shared Prisma Module
import { PrismaModule, PrismaService } from '@going-monorepo-clean/prisma-client';

// Simple repositories and gateways
import { PrismaPaymentRepository } from './repositories/prisma-payment.repository';
import { StripeGateway } from './gateways/stripe.gateway';

export const I_PAYMENT_REPOSITORY = Symbol('IPaymentRepository');
export const I_PAYMENT_GATEWAY = Symbol('IPaymentGateway');

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
  ],
  providers: [
    PrismaPaymentRepository,
    StripeGateway,
    {
      provide: I_PAYMENT_REPOSITORY,
      useClass: PrismaPaymentRepository,
    },
    {
      provide: I_PAYMENT_GATEWAY,
      useClass: StripeGateway,
    },
  ],
  exports: [
    I_PAYMENT_REPOSITORY, 
    I_PAYMENT_GATEWAY,
    PrismaPaymentRepository, 
    StripeGateway,
    PrismaService,
  ],
})
export class InfrastructureModule {}