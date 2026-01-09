import { Module } from '@nestjs/common';
import { DatabaseModule, SharedLoggerModule } from '@going-monorepo/shared-backend';

@Module({
  imports: [
    DatabaseModule,
    SharedLoggerModule,
    // Aqu importars luego los mdulos especficos de este servicio
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
