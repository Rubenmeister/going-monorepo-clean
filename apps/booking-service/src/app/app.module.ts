import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@going-monorepo-clean/prisma-client';
import { SharedLoggerModule } from '@going-monorepo/shared-backend';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SharedLoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
