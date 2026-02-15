import { Controller, Post, Body } from '@nestjs/common';
import {
  CreateTourDto,
  CreateTourUseCase,
} from '@going-monorepo-clean/domains-tour-application';

@Controller('tours')
export class TourController {
  constructor(
    private readonly createTourUseCase: CreateTourUseCase,
  ) {}

  @Post()
  async createTour(@Body() dto: CreateTourDto): Promise<any> {
    return this.createTourUseCase.execute(dto);
  }
}
