import { Module } from '@nestjs/common';
import { CreateTourUseCase } from './use-cases/create-tour.use-case';
// Import other use cases if needed

@Module({
  providers: [
    CreateTourUseCase,
  ],
  exports: [
    CreateTourUseCase,
  ],
})
export class TourApplicationModule {}
