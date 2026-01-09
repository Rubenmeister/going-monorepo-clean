import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@going-monorepo-clean/prisma-client';
import { SharedLoggerModule } from '@going-monorepo/shared-backend';

import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { KushkiService } from '../infrastructure/kushki.service';
import { PrismaPaymentRepository } from '../infrastructure/persistence/prisma-payment.repository';
import { IPaymentRepository } from '@going-monorepo-clean/domains-payment';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SharedLoggerModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    KushkiService,
    {
      provide: IPaymentRepository,
      useClass: PrismaPaymentRepository,
    },
  ],
})
export class AppModule {}
