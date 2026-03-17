import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateTourDto,
  CreateTourUseCase,
  GetTourByIdUseCase,
  PublishTourUseCase,
  SearchToursUseCase,
} from '@going-monorepo-clean/domains-tour-application';
import { TourSearchFilters } from '@going-monorepo-clean/domains-tour-core';
import { JwtAuthGuard, CurrentUser } from '../domain/ports';

interface AuthUser { id: string; email: string; role: string; }

@Controller('tours')
export class TourController {
  constructor(
    private readonly createTourUseCase: CreateTourUseCase,
    private readonly getTourByIdUseCase: GetTourByIdUseCase,
    private readonly publishTourUseCase: PublishTourUseCase,
    private readonly searchToursUseCase: SearchToursUseCase,
  ) {}

  /** POST /tours — requires JWT; hostId from token */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createTour(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateTourDto,
  ): Promise<any> {
    return this.createTourUseCase.execute({ ...dto, hostId: user.id });
  }

  /** GET /tours/search — public */
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

  /** GET /tours/:id — public */
  @Get(':id')
  async getTourById(@Param('id') id: string): Promise<any> {
    const tour = await this.getTourByIdUseCase.execute(id);
    return tour.toPrimitives();
  }

  /** PATCH /tours/:id/publish — requires JWT */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishTour(@Param('id') id: string): Promise<any> {
    return this.publishTourUseCase.execute(id);
  }
}
