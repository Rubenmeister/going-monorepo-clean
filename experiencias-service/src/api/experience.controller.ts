import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import {
  CreateExperienceDto,
  CreateExperienceUseCase,
  SearchExperiencesUseCase,
} from '@going-monorepo-clean/domains-experience-application';
import { ExperienceSearchFilters } from '@going-monorepo-clean/domains-experience-core';

@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly createExperienceUseCase: CreateExperienceUseCase,
    private readonly searchExperiencesUseCase: SearchExperiencesUseCase,
  ) {}

  @Post()
  async createExperience(@Body() dto: CreateExperienceDto): Promise<any> {
    return this.createExperienceUseCase.execute(dto);
  }

  @Get('search')
  async searchExperiences(
    @Query('city') city?: string,
    @Query('maxPrice') maxPrice?: string,
  ): Promise<any[]> {
    const filters: ExperienceSearchFilters = {
      locationCity: city,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    };
    return this.searchExperiencesUseCase.execute(filters);
  }
}
