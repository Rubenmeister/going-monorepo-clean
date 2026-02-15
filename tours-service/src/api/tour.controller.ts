import { Controller, Post, Body } from '@nestjs/common';
import { CreateTourUseCase, CreateTourDto } from '@going-monorepo-clean/domains-tour-application';

@Controller('tours')
export class TourController {
  constructor(private readonly createTourUseCase: CreateTourUseCase) {}

  @Post()
  async create(@Body() dto: CreateTourDto) {
    return this.createTourUseCase.execute(dto);
  }
}
