import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import {
  CreateTourDto,
  CreateTourUseCase,
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-application';
import { TourSearchFilters } from '@going-monorepo-clean/domains-tour-core';

@Controller('tours')
export class TourController {
  constructor(
    private readonly createTourUseCase: CreateTourUseCase,
    private readonly searchToursUseCase: SearchToursUseCase,
  ) {}

  @Post()
  async createTour(@Body() dto: CreateTourDto): Promise<any> {
    return this.createTourUseCase.execute(dto);
  }

  @Get('search')
  async searchTours(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<any[]> {
    const filters: TourSearchFilters = {
      locationCity: city,
      category: category as any,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };
    return this.searchToursUseCase.execute(filters);
  }
}
