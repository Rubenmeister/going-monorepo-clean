import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateExperienceDto,
  CreateExperienceUseCase,
  GetExperienceByIdUseCase,
  SearchExperiencesUseCase,
} from '@going-monorepo-clean/domains-experience-application';
import { ExperienceSearchFilters } from '@going-monorepo-clean/domains-experience-core';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

interface AuthUser { id: string; email: string; role: string; }

@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly createExperienceUseCase: CreateExperienceUseCase,
    private readonly getExperienceByIdUseCase: GetExperienceByIdUseCase,
    private readonly searchExperiencesUseCase: SearchExperiencesUseCase,
  ) {}

  /** POST /experiences — requires JWT; hostId from token */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createExperience(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateExperienceDto,
  ): Promise<any> {
    return this.createExperienceUseCase.execute({ ...dto, hostId: user.id });
  }

  /** GET /experiences/search — public */
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

  /** GET /experiences/:id — public */
  @Get(':id')
  async getExperienceById(@Param('id') id: string): Promise<any> {
    const exp = await this.getExperienceByIdUseCase.execute(id);
    return exp.toPrimitives();
  }
}
