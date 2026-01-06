import { Module } from '@nestjs/common';
import { DatabaseModule } from '@going-monorepo/shared-backend';

@Module({
  imports: [
    DatabaseModule,
    // Aqu� importar�s luego los m�dulos espec�ficos de este servicio
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

