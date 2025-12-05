import { Body, Controller, Post } from '@nestjs/common';
import { CreateTourUseCase, CreateTourDto } from '@going-monorepo-clean/domains-tour-application';

@Controller('tours')
export class ToursController {
  constructor(
    private readonly createTourUseCase: CreateTourUseCase,
  ) {}

  @Post()
  async createTour(@Body() dto: CreateTourDto) {
    return this.createTourUseCase.execute(dto);
  }
}
