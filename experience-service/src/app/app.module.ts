import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../libs/shared/src';

@Module({
  imports: [
    DatabaseModule,
    // Aquí importarás luego los módulos específicos de este servicio
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
