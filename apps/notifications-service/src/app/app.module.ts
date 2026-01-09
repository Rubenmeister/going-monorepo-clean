import { Module } from '@nestjs/common';
import { SharedLoggerModule } from '@going-monorepo/shared-backend';
import { PrismaModule } from '@going-monorepo-clean/prisma-client';

@Module({
  imports: [
    PrismaModule,
    SharedLoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
